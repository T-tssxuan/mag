var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('AA.AfId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': [],
    'AA.AuId': ['AA.AuId', 'Id']
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
            //AA.AfId->AA.AuId
            log.debug("start to Search Path AA.AfId->AA.AuId");
            if(reqDetail.desc[1]=="AA.AuId")
            {
                //request param
                var expr = "Composite(AA.AuId="+reqDetail.value[1]+")";
                var attributes = "AA.AuId,AA.AfId";
                var count = 1000;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url){
                    handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                }
                else{
                    error="AA.AfId->AA.AuId get URL error: url is null!";
                    callback(null);//not callback error
                }
            }
            else{
                callback(null);
            }//if not, exit immediately
        },
        function(callback) {
            // AA.AfId->AA.AuId->Id
            log.debug("start to Search Path AA.AfId->AA.AuId->Id");
            if(reqDetail.desc[1]=="Id")
            {
                var expr = "Id="+reqDetail.value[1];
                var attributes = "AA.AuId";
                var count = 100;

                //make url
                var url = magUrlMake(expr, attributes, count);

                //send request
                if(url){
                    handle_3_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                }
                else{
                    error="AA.AfId->AA.AuId->Id get URL error: url is null!";
                    callback(null);
                }
                
            }
            else{
                callback(null);
            }//if not, exit immediately  
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


function handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback){
    tadaRequest(url, reqInfo, function(err, data) {
        if(!err && data.length>0){
            //find all Afid of the target author
            var hashTable = {};
            for(var i = 0; i < data.length;i++){
                for(var j = 0; j < data[i].AA.length;j++)
                {
                    var AAArray = data[i].AA;
                    if(AAArray[j].AuId == reqDetail.value[1] && AAArray[j].AfId)
                    {
                        //found an Afid of the target author
                        hashTable[AAArray[j].AfId] = 1;
                    }
                }
            }

            //get the intersection of source author and target author
            for(var i = 0;i < basePath.length;i++){
                if(basePath[i] in hashTable){
                    //found 2-hop result
                    var path = [reqDetail.value[0], basePath[i], reqDetail.value[1]];
                    //log.debug("found 2-hop(AA.AuId->AA.AfId->AA.AuId) result:"+path);
                    result.push(path);
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
 * @param {Array} basePath 
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Function} callback
 */
function handle_3_hop_result(url, reqInfo, basePath, result, reqDetail, callback){
    
    tadaRequest(url, reqInfo, function(err, data) {
        if(!err && data.length>0)
        {
            var data = data[0].AA;
            var resultAuId = [];

            //get targetId's AuId
            for(var i = 0; i < data.length; i++){
                resultAuId[i] = data[i].AuId;
            }

            //send each targetId's AuId to get their AfId
            async.each(resultAuId, function(item, finish){
                var expr = "Composite(AA.AuId="+item+")";
                var attributes = "AA.AuId,AA.AfId";
                var count = 1000;

                //make url
                var url = magUrlMake(expr, attributes, count); 

                if(url){
                    handle_AfId(url, reqInfo, item, basePath, result, reqDetail, finish);
                }
                else{
                    error = "AfId->AuId->Id get url null!";
                    finish(null);
                }

            },
            function(err){
                callback(null);
            });
        }   
        else{
            callback(null);
        }
        
    });   
}

function handle_AfId(url, reqInfo, item, basePath, result, reqDetail, callback)
{
    tadaRequest(url, reqInfo, function(err, data){
        if(!err && data.length>0){
            //find all AfId of item
            var hashTable = {};
            for(var i=0;i<data.length;i++){
                var AA = data[i].AA;
                for(var j = 0;j<AA.length;j++)
                {
                    if(AA[j].AuId==item && AA[j].AfId){
                        //found item's AfId 
                        hashTable[AA[j].AfId] = 1;
                    }
                }
            }

            /*find intersection of basePath and item's AfIds*/
            for(var i = 0; i<basePath.length ;i++){
                if(basePath[i] in hashTable){
                    //found a 3-hop path
                    var path = [reqDetail.value[0], basePath[i], item, reqDetail.value[1]];
                    //log.debug("found 3-hop(AA.AuId->AA.AfId->AA.AuId->Id) result:"+path);
                    result.push(path);
                }
            }
        }
        callback(null);
    });
}