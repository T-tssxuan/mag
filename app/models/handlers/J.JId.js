var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-J.JId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': []
}

var limit = 1000;
var count = 10000;
var smCount = 1;

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
            // J.JId->Id->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != "AA.AuId") {
                return callback(null);
            }
            var expr = "Composite(AA.AuId=" + reqDetail.value[1] + ")";
            var attributes = "F.FId,C.CId,AA.AuId,AA.AfId,J.JId,Id,RId";
            var url = magUrlMake(expr, attributes, count);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err) {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i].J && data[i].J.JId == basePath[0]) {
                            result.push([reqDetail.value[0], basePath[0], 
                                data[i].Id, reqDetail.value[1]]);
                        }
                    }
                }
                callback(null);
            });
        },
        function(callback) {
            // J.JId->Id->RId 2-hop and 3-hop
            if (reqDetail.desc[1] != "Id") {
                return callback(null);
            }
            var expr = "Id=" + reqDetail.value[1];
            var attributes = "F.FId,C.CId,AA.AuId,J.JId,CC";
            var url = magUrlMake(expr, attributes, smCount);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    // get 2-hop results
                    if (data[0].J && data[0].J.JId == basePath[0]) {
                        result.push([reqDetail.value[0], basePath[0], 
                            reqDetail.value[1]]);
                    }
                    if (!Number.isNaN(data[0].CC) && data[0].CC <= 10000) {
                        // get 3-hop results by using prerequest
                        var expr = "RId=" + reqDetail.value[1];
                        var attributes = "F.FId,C.CId,AA.AuId,J.JId,Id";
                        var url = magUrlMake(expr, attributes, count);
                        tadaRequest(url, reqInfo, function(err, data) {
                            if (!err) {
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i].J && data[i].J.JId == basePath[0]) {
                                        result.push([reqDetail.value[0], basePath[0], 
                                            data[i].Id, reqDetail.value[1]]);
                                    }
                                }
                            }
                            callback(null);
                        });
                    } else {
                        // get 3-hop results directly
                        var expr = "And(Composite(J.JId=" + basePath[0];
                        expr += "),RId=" + reqDetail.value[1] + ")";
                        var url = magUrlMake(expr, "Id", limit);
                        tadaRequest(url, reqInfo, function(err, data) {
                            if (!err) {
                                for (var i = 0; i < data.length; i++) {
                                    result.push([reqDetail.value[0], basePath[0], 
                                        data[i].Id, reqDetail.value[1]]);
                                }
                            }
                            callback(null);
                        });
                    }
                }
            });      
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
