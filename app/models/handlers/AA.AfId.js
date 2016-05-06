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
            if(reqDetail.desc[1]=="AA.AuId")
            {
                //request param
                var expr = "Composite(AA.AuId="+reqDetail.value[1]+")";
                var attributes = "AA.AuId,AA.AfId";
                var count = 100;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url != null){
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
            if(reqDetail.desc[1]=="Id")
            {
                async.each(basePath, function(item, next){
                    var expr = "And(Composite(AA.AfId="+item+"),Id="+reqDetail.value[1]+")";
                    var attributes = "AA.AuId,AA.AfId";
                    var count = 50;

                    //make url
                    var url = magUrlMake(expr, attributes, count);

                    //send request
                    if(url != null){
                        handle_3_hop_result(url, reqInfo, item, result, reqDetail, next);
                    }
                    else{
                        error="AA.AfId->AA.AuId->Id get URL error: url is null!";
                        next(null);//do not send error
                    }
                },
                function(err){
                    callback(err);
                });
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
        if(data != null){
            //find all Afid of the target author
            var resultAfid = [];
            for(var i = 0; i < data.length;i++){
                for(var j = 0; j < data[i].AA.length;j++)
                {
                    var AAArray = data[i].AA;
                    if(AAArray[j].AuId == reqDetail.value[1] && AAArray[j].AfId != null)
                    {
                        //found an Afid of the target author
                        resultAfid.push(AAArray[j].AfId);
                    }
                }
            }

            //get the intersection of source author and target author
            var hashTable = {};
            for(var i = 0;i < basePath.length;i++){
                hashTable[basePath[i]] = 1;
            }
            for(var i = 0;i < resultAfid.length;i++){
                if(resultAfid[i] in hashTable){
                    //found 2-hop result
                    var path = [reqDetail.value[0], resultAfid[i], reqDetail.value[1]];
                    log.debug("found 2-hop(AA.AuId->AA.AfId->AA.AuId) result:"+path);
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
 * @param {Object} basePath_i C.CId from last hop
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Function} callback
 */
function handle_3_hop_result(url, reqInfo, basePath_i, result, reqDetail, callback){
    
    tadaRequest(url, reqInfo, function(err, data) {
        if(data != null)
        {
            
        }   
        callback(null);
    });
    
}