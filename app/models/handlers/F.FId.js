var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');
var generateOrExpr = require('../generate-or-expr');

var log = log4js.getLogger('F.FId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': []
}

var offsets = [];


/**
 * Search the path with given basePath
 *
 * @param {Object} reqInfo the infomation about the request
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Array} basePath the base path of the request
 * @param {Function} cbFunc the callback function
 */
function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
    async.parallel([
        function(callback) {
            // F.FId->Id->AA.AuId
            if(reqDetail.desc[1]=="AA.AuId"){
                //log.debug("start to Search Path F.FId->Id->AA.AuId");

                var expr = "Composite(AA.AuId="+reqDetail.value[1]+")";
                var attributes = "F.FId,C.CId,AA.AuId,AA.AfId,J.JId,Id,RId";
                var count = 10000;

                //make url
                var url = magUrlMake(expr, attributes, count);

                //send request
                if(url){
                    //log.debug("F.FId->Id->AA.AuId send request:"+url);
                    handle_3_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                }
                else{
                    error="F.FId->Id->AA.AuId get URL error: url is null!";
                    callback(null);//do not send error
                }
               
            } else {
                callback(null);
            }            
        },
        function(callback) {
            // F.FId->Id->Id
            if(reqDetail.desc[1]=="Id")
            {
                //log.debug("start to Search Path F.FId->Id->Id");
                var expr = "Id="+reqDetail.value[1];
                var attributes = "F.FId,C.CId,AA.AuId,J.JId,CC";
                var count = 1;
                
                //make url
                var url = magUrlMake(expr, attributes, count);

                tadaRequest(url, reqInfo, function(err, data){
                    if(!err && data.length>0)
                    {
                        handle_2_hop_result(basePath, result, reqDetail, data);
                        
                        var CC = data[0].CC;
                        if(CC && CC>10000){
                            for (var i = 0; i*10000 < CC; i++) {
                                offsets.push(i * 10000);
                            }
                            handle_3_hop_splitRId(reqInfo, basePath, result, reqDetail, callback);
                        }
                        else{
                            var expr = "RId="+reqDetail.value[1];
                            var attributes = "F.FId,C.CId,AA.AuId,J.JId,Id";
                            var count = 10000;
                            var offset = 0;
                            var url = magUrlMake(expr, attributes, count, offset);

                            //send request
                            if(url){
                                //log.debug("F.FId->Id->Id send Or request:"+url);
                                handle_3_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                            }
                            else{
                                error="F.FId->Id->Id get URL error: url is null!";
                                callback(null);//do not send error
                            }
                        }
                    }
                    else{
                        callback(null);
                    }
                });
            }
            else{
                callback(null);
            }
        }
    ], function(err) {
        cbFunc(err);
    });
}

/**
 * Search the path with given basePath
 *
 * @param {Object} reqInfo the infomation about the request
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Array} basePath the base path of the request
 * @param {Function} cbFunc the callback function
 */
module.exports = function(reqInfo, reqDetail, result, basePath, cbFunc) {
    // Before search path check whether this module suitable for query pair
    if (adatper[reqDetail.desc[0]].indexOf(reqDetail.desc[1]) == -1) {
        cbFunc();
    } else {
        searchPath(reqInfo, reqDetail, result, basePath, cbFunc);
    }
}

/**
 * get 2-hop result by response data and basePath
 *
 * @param {Object} url request url
 * @param {Object} response data
 * @param {Object} basePath F.FId from last hop
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Function} callback
 */
function handle_2_hop_result(basePath, result, reqDetail, data) {
    if(data.length>0){
        var FidsArray = data[0].F;//this array only has one element, get its "F" array

        if(FidsArray)
        {
            /*find intersection of startFid and endFid*/
            var hashTable = {};
            for(var i = 0; i<basePath.length;i++){
                hashTable[basePath[i]] = 1;
            }
            for(var i = 0;i<FidsArray.length;i++){
                if(FidsArray[i].FId in hashTable){
                    //2-hop result
                    var path = [reqDetail.value[0], FidsArray[i].FId, reqDetail.value[1]];
                    //log.debug("found 2-hop(Id->F.FId->Id) result:"+path);
                    //add to result set
                    result.push(path);
                }
            }
        }       
    }
}

/**
 * get 3-hop result by response data and basePath
 *
 * @param {Object} url request url
 * @param {Object} response data
 * @param {Array} basePath F.FId from last hop
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Function} callback
 */
function handle_3_hop_result(url, reqInfo, basePath, result, reqDetail, callback){
    
    tadaRequest(url, reqInfo, function(err, data) {
        if(!err && data.length>0)
        {
            var baseTable = {};
            for(var i = 0;i < basePath.length;i++){
                baseTable[basePath[i]] = 1;
            }

            for(var i = 0;i < data.length;i++)
            {
                var Id = data[i].Id;
                var Fids = data[i].F;
                if(!Fids)
                    continue;
                for(var j = 0;j < Fids.length;j++){
                    if(Fids[j].FId in baseTable){
                        //found a unique path
                        var path = [reqDetail.value[0], Fids[j].FId, Id, reqDetail.value[1]];
                        result.push(path);
                    }
                }
            }
        }
        callback(null);
    });
}

function handle_3_hop_result_toRid(url, reqInfo, basePath_i, result, reqDetail, callback){
    tadaRequest(url, reqInfo, function(err, data){
        if(!err && data.length>0){
            for(var i = 0;i < data.length;i++){
                var path = [reqDetail.value[0], basePath_i, data[i].Id, reqDetail.value[1]];
                //log.debug("Id->F.FId->Id->Id found 3-hop result!");
                result.push(path);   
            }
            
        }
        callback(null);    
    },0,1);
}

// function handle_3_hop_result_toRid_useOr(url, reqInfo, basePath, resultTable, result, reqDetail, callback){
//     tadaRequest(url, reqInfo, function(err, data){
//         if(!err && data.length>0){
//             var baseTable = {};
//             for(var i = 0;i < basePath.length;i++){
//                 baseTable[basePath[i]] = 1;
//             }

//             for(var i = 0;i < data.length;i++){
//                 var FIds = data[i].F;
//                 for(var j = 0; j < FIds.length;j++){
//                     var tempKey = data[i].Id+"*"+FIds[j].FId;
//                     if(FIds[j].FId in baseTable && !(tempKey in resultTable)){
//                         //found a path
//                         var path = [reqDetail.value[0], FIds[j].FId, data[i].Id, reqDetail.value[1]];
//                         result.push(path);
//                         resultTable[tempKey] = 1;
//                     }
//                 }  
//             }
            
//         }
//         callback(null);    
//     });
// }


function handle_3_hop_splitRId(reqInfo, basePath, result, reqDetail, callback){
    if(reqDetail.desc[1]=="Id"){
        var orExpr = generateOrExpr("F.FId", basePath, 20);
        var tempPathAuidTable = {};

        async.each(basePath, function(item, finish) {
            var expr = "And("+ orExpr +",RId="+reqDetail.value[1]+")";
            var attributes = "Id";
            var count = 10000;

            async.each(offsets, function(offs, next){
                //make url
                var url = magUrlMake(expr, attributes, count, offs);

                //send request
                if(url){
                    //log.debug("F.FId->Id->Id send split request:"+url);
                    handle_3_hop_result_toRid(url, reqInfo, item, result, reqDetail, next);
                }
                else{
                    error="F.FId->Id->Id get URL error: url is null!";
                    next(null);//do not send error
                }
            },
            function(err){
                finish(null);
            });
            
        }, 
        function(err) {
            callback(err)
        });
    } else {
        callback(null);
    } 
}