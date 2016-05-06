var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('C.CId');

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
            //C.CId->Id
            if(reqDetail.desc[1]=="Id")
            {
                //request param
                var expr = "Id="+reqDetail.value[1];
                var attributes = "C.CId";
                var count = 1;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url != null){
                    tadaRequest(url, reqInfo, function(err, data) {
                        var resultC = data[0].C;
                        if(resultC != null)
                        {
                            var resultCid = resultC.CId;

                            if(basePath[0] == resultCid){
                                //2-hop result
                                var path = [reqDetail.value[0], resultCid, reqDetail.value[1]];
                                log.debug("found 2-hop(Id->C.CId->Id) result:"+path);
                                result.push(path);
                            }
                        }
                        callback(null);
                    });
                }
                else{
                    error="C.CId->Id get URL error: url is null!";
                    callback(null);//not callback error
                }
            }
            else{
                callback(null);
            }//if not, exit immediately
        },
        function(callback) {
            // C.CId->Id->AA.AuId
            if(reqDetail.desc[1]=="AA.AuId")
            {
                //request param
                var expr = "And(Composite(C.CId="+basePath[0]+"),Composite(AA.AuId="+reqDetail.value[1]+"))";
                var attributes = "Id";
                var count = 100;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url != null){
                    handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
                }
                else{
                    error="C.CId->Id->AA.AuId get URL error: url is null!";
                    callback(null);//not callback error
                }
            }
            else{
                callback(null);
            }      
        },
        function(callback) {
            // C.CId->Id->Id
            if(reqDetail.desc[1]=="Id")
            {
                //request param
                var expr = "And(Composite(C.CId="+basePath[0]+"),RId="+reqDetail.value[1]+")";
                var attributes = "Id";
                var count = 1000;
                //make url
                var url = magUrlMake(expr, attributes, count);
                //send request
                if(url != null){
                    handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
                }
                else{
                    error="C.CId->Id->Id get URL error: url is null!";
                    callback(null);//not callback error
                }
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
            for(var i=0; i < data.length;i++){
                var resultId = data[i].Id; 
                var path = [reqDetail.value[0], basePath_i, resultId, reqDetail.value[1]];

                log.debug("found 3-hop(Id->C.CId->Id->"+reqDetail.desc[1]+") result:"+path);
                //add to result set
                result.push(path);
            }
        }   
        callback(null);
    });
    
}