var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('F.FId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': []
}

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
        function(callback){
            //F.FId->Id
            if(reqDetail.desc[1]=="Id")
            {
                //request param
                var expr = "Id="+reqDetail.value[1];
                var attributes = "F.FId";
                var count = 100;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url){
                    handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                }
                else{
                    error="F.FId->Id get URL error: url is null!";
                    callback(null);//not callback error
                }
            }
            else{
                callback(null);
            }//if not, exit immediately
        },
        function(callback) {
            // F.FId->Id->AA.AuId
            if(reqDetail.desc[1]=="AA.AuId"){
                async.each(basePath, function(item, finish) {
                    var expr = "And(Composite(F.FId="+ item +"),Composite(AA.AuId="+reqDetail.value[1]+"))";
                    var attributes = "Id";
                    var count = 100;

                    //make url
                    var url = magUrlMake(expr, attributes, count);

                    //send request
                    if(url){
                        handle_3_hop_result(url, reqInfo, item, result, reqDetail, finish);
                    }
                    else{
                        error="F.FId->Id->AA.AuId get URL error: url is null!";
                        finish(null);//do not send error
                    }
                }, 
                function(err) {
                    callback(err)
                });
            } else {
                callback(null);
            }            
        },
        function(callback) {
            // F.FId->Id->Id
            if(reqDetail.desc[1]=="Id"){
                async.each(basePath, function(item, finish) {
                    var expr = "And(Composite(F.FId="+ item +"),RId="+reqDetail.value[1]+")";
                    var attributes = "Id";
                    var count = 10000;

                    //make url
                    var url = magUrlMake(expr, attributes, count);

                    //send request
                    if(url){
                        handle_3_hop_result(url, reqInfo, item, result, reqDetail, finish);
                    }
                    else{
                        error="F.FId->Id->Id get URL error: url is null!";
                        finish(null);//do not send error
                    }
                }, 
                function(err) {
                    callback(err)
                });
            } else {
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
function handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback) {
    tadaRequest(url, reqInfo, function(err, data) {
        if(data){
            var FidsArray = data[0].F;//this array only has one element, get its "F" array
            var FidsStringArray = [];//resultId's F.FId

            if(FidsArray)
            {
                for(var i=0;i<FidsArray.length;i++){
                    FidsStringArray[i]=FidsArray[i].FId;
                }
                
                /*find intersection of startFid and endFid*/
                var hashTable = {};
                for(var i = 0; i<basePath.length;i++){
                    hashTable[basePath[i]] = 1;
                }
                for(var i = 0;i<FidsStringArray.length;i++){
                    if(FidsStringArray[i] in hashTable){
                        //2-hop result
                        var path = [reqDetail.value[0], FidsStringArray[i], reqDetail.value[1]];
                        //log.debug("found 2-hop(Id->F.FId->Id) result:"+path);
                        //add to result set
                        result.push(path);
                    }
                    hashTable[FidsStringArray[i]] = 1;
                }
            }       
        }
        callback(null);
    });
}

/**
 * get 3-hop result by response data and basePath
 *
 * @param {Object} url request url
 * @param {Object} response data
 * @param {Object} basePath_i ith F.FId from last hop
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Function} callback
 */
function handle_3_hop_result(url, reqInfo, basePath_i, result, reqDetail, callback){
    
    tadaRequest(url, reqInfo, function(err, data) {
        if(data)
        {
            for(var i=0; i < data.length;i++){
                var resultId = data[i].Id; 
                var path = [reqDetail.value[0], basePath_i, resultId, reqDetail.value[1]];

                //log.debug("found 3-hop(Id->F.FId->Id->"+reqDetail.desc[1]+") result:"+path);
                //log.debug(JSON.stringify(result));
                //add to result set
                result.push(path);
            }
        }
        callback(null);
    });
    
}