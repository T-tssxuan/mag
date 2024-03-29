var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');
var generateOrExpr = require('../generate-or-expr');

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
        function(callback) {
            // C.CId->Id->AA.AuId
            if(reqDetail.desc[1]=="AA.AuId"){
                //log.debug("start to Search Path C.CId->Id->AA.AuId");

                var expr = "Composite(AA.AuId="+reqDetail.value[1]+")";
                var attributes = "F.FId,C.CId,AA.AuId,AA.AfId,J.JId,Id,RId";
                var count = 10000;

                //make url
                var url = magUrlMake(expr, attributes, count);

                //send request
                if(url){
                    //log.debug("C.CId->Id->AA.AuId send request:"+url);
                    handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
                }
                else{
                    error="C.CId->Id->AA.AuId get URL error: url is null!";
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
                //log.debug("start to Search Path C.CId->Id->Id");
                var expr = "Id="+reqDetail.value[1];
                var attributes = "F.FId,C.CId,AA.AuId,J.JId,CC";
                var count = 1;
                
                //make url
                var url = magUrlMake(expr, attributes, count);

                tadaRequest(url, reqInfo, function(err, data){
                    if(!err && data.length>0)
                    {
                        handle_2_hop_result(basePath[0], result, reqDetail, data);
                        
                        var CC = data[0].CC;
                        if(CC && CC>10000){
                            //request param
                            var expr = "And(Composite(C.CId="+basePath[0]+"),RId="+reqDetail.value[1]+")";
                            var attributes = "Id";
                            var count = 10000;
                            //make url
                            var url = magUrlMake(expr, attributes, count);
                            //send request
                            if(url){
                                handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
                            }
                            else{
                                error="C.CId->Id->Id get URL error: url is null!";
                                callback(null);//not callback error
                            }                            
                        }
                        else
                        {
                            var expr = "RId="+reqDetail.value[1];
                            var attributes = "F.FId,C.CId,AA.AuId,J.JId,Id";
                            var count = 10000;
                            var offset = 0;
                            var url = magUrlMake(expr, attributes, count, offset);

                            //send request
                            if(url){
                                //log.debug("C.CId->Id->Id send Or request:"+url);
                                handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
                            }
                            else{
                                error="C.CId->Id->Id get URL error: url is null!";
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
function handle_2_hop_result(basePath_i, result, reqDetail, data) {
    if(data.length>0){
        var C = data[0].C;//this array only has one element, get its "C" 

        if(C && C.CId == basePath_i)
        {
            var path = [reqDetail.value[0], C.CId, reqDetail.value[1]];
            //log.debug("found 2-hop(Id->F.FId->Id) result:"+path);
            //add to result set
            result.push(path);
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
function handle_3_hop_result(url, reqInfo, basePath_i, result, reqDetail, callback){
    
    tadaRequest(url, reqInfo, function(err, data) {
        if(!err && data.length>0)
        {
            for(var i = 0;i < data.length;i++)
            {
                var Id = data[i].Id;
                var C = data[i].C;
                if(C && C.CId == basePath_i){
                    //found a unique path
                    var path = [reqDetail.value[0], C.CId, Id, reqDetail.value[1]];
                    result.push(path);
                }
            }
        }
        callback(null);
    });
}


// var log4js = require('log4js');
// var async = require('async');
// var tadaRequest = require('../tada-request');
// var magUrlMake = require('../mag-url-make');

// var log = log4js.getLogger('C.CId');

// // Using this object to check whether this path app suitable to the query pair
// var adatper = {
//     'Id': ['AA.AuId', 'Id'],
//     'AA.AuId': []
// }

// /** 
//  * Search the path with given basePath
//  *
//  * @param {Object} reqInfo the infomation about the request
//  * @param {Object} reqDetail the infomation about the query pair
//  * @param {Array} basePath the base path of the request
//  * @param {Function} cbFunc the callback function
//  */
// function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
//     async.parallel([
//         function(callback){
//             //C.CId->Id
//             log.debug("start to Search Path C.CId->Id");
//             if(reqDetail.desc[1]=="Id")
//             {
//                 //request param
//                 var expr = "Id="+reqDetail.value[1];
//                 var attributes = "C.CId";
//                 var count = 1;
//                 //make url
//                 var url = magUrlMake(expr, attributes, count);
//                 //send request
//                 if(url){
//                     handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback);
                    
//                 }
//                 else{
//                     error="C.CId->Id get URL error: url is null!";
//                     callback(null);//not callback error
//                 }
//             }
//             else{
//                 callback(null);
//             }//if not, exit immediately
//         },
//         function(callback) {
//             // C.CId->Id->AA.AuId
//             log.debug("start to Search Path C.CId->Id->AA.AuId");
//             if(reqDetail.desc[1]=="AA.AuId")
//             {
//                 //request param
//                 var expr = "And(Composite(C.CId="+basePath[0]+"),Composite(AA.AuId="+reqDetail.value[1]+"))";
//                 var attributes = "Id";
//                 var count = 100;
//                 //make url
//                 var url = magUrlMake(expr, attributes, count);
//                 //send request
//                 if(url){
//                     handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
//                 }
//                 else{
//                     error="C.CId->Id->AA.AuId get URL error: url is null!";
//                     callback(null);//not callback error
//                 }
//             }
//             else{
//                 callback(null);
//             }      
//         },
//         function(callback) {
//             // C.CId->Id->Id
//             log.debug("start to Search Path C.CId->Id->Id");
//             if(reqDetail.desc[1]=="Id")
//             {
//                 //request param
//                 var expr = "And(Composite(C.CId="+basePath[0]+"),RId="+reqDetail.value[1]+")";
//                 var attributes = "Id";
//                 var count = 10000;
//                 //make url
//                 var url = magUrlMake(expr, attributes, count);
//                 //send request
//                 if(url){
//                     handle_3_hop_result(url, reqInfo, basePath[0], result, reqDetail, callback);
//                 }
//                 else{
//                     error="C.CId->Id->Id get URL error: url is null!";
//                     callback(null);//not callback error
//                 }
//             }
//             else{
//                 callback(null);
//             }
//         }
//     ], function(err) {
//         cbFunc(err);
//     });
// }

// /**
//  * Search the path with given basePath
//  *
//  * @param {Object} reqInfo the infomation about the request
//  * @param {Object} reqDetail the infomation about the query pair
//  * @param {Array} basePath the base path of the request
//  * @param {Function} cbFunc the callback function
//  */
// module.exports = function(reqInfo, reqDetail, result, basePath, cbFunc) {
//     // Before search path check whether this module suitable for query pair
//     if (adatper[reqDetail.desc[0]].indexOf(reqDetail.desc[1]) == -1) {
//         cbFunc();
//     } else {
//         searchPath(reqInfo, reqDetail, result, basePath, cbFunc);
//     }
// }

// /**
//  * get 2-hop result by response data and basePath
//  *
//  * @param {Object} url request url
//  * @param {Object} response data
//  * @param {Object} basePath F.FId from last hop
//  * @param {Array} final result set
//  * @param {Object} reqDetail the infomation about the query pair
//  * @param {Function} callback
//  */
// function handle_2_hop_result(url, reqInfo, basePath, result, reqDetail, callback) {
//     tadaRequest(url, reqInfo, function(err, data) {
//         if(!err && data.length>0)
//         {
//             var resultC = data[0].C;
//             if(resultC)
//             {
//                 var resultCid = resultC.CId;

//                 if(basePath[0] == resultCid){
//                     //2-hop result
//                     var path = [reqDetail.value[0], resultCid, reqDetail.value[1]];
//                     //log.debug("found 2-hop(Id->C.CId->Id) result:"+path);
//                     result.push(path);
//                 }
//             }
//         }
//         callback(null);
//     });
// }

// /**
//  * get 3-hop result by response data and basePath
//  *
//  * @param {Object} url request url
//  * @param {Object} response data
//  * @param {Object} basePath_i C.CId from last hop
//  * @param {Array} final result set
//  * @param {Object} reqDetail the infomation about the query pair
//  * @param {Function} callback
//  */
// function handle_3_hop_result(url, reqInfo, basePath_i, result, reqDetail, callback){
    
//     tadaRequest(url, reqInfo, function(err, data) {
//         if(!err && data.length>0)
//         {
//             for(var i=0; i < data.length;i++){
//                 var resultId = data[i].Id; 
//                 var path = [reqDetail.value[0], basePath_i, resultId, reqDetail.value[1]];

//                 //log.debug("found 3-hop(Id->C.CId->Id->"+reqDetail.desc[1]+") result:"+path);
//                 //add to result set
//                 result.push(path);
//             }
//         }   
//         callback(null);
//     });
    
// }