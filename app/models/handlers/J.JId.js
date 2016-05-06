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
            var expr = "And(Composite(J.JId=" + basePath[0];
            expr += "),Composite(AA.AuId=" + reqDetail.value[1] + "))";
            var url = magUrlMake(expr, "Id", limit);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err) {
                    for (var i = 0; i < data.length; i++) {
                        result.push([reqDetail.value[0], basePath[0], 
                            data[i].Id, reqDetail.value[1]])
                    }
                }
                callback(null);
            });
        },
        function(callback) {
            // J.JId->Id(Id)
            if (reqDetail.desc[1] != "Id") {
                return callback(null);
            }
            var expr = "And(Id=" + reqDetail.value[1];
            expr += ",Composite(J.JId=" + basePath[0] +"))";
            var url = magUrlMake(expr, "", limit);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    result.push([reqDetail.value[0], basePath[0], 
                        reqDetail.value[1]]);
                }
                callback(null);
            });            
        },
        function(callback) {
            // J.JId->Id->RId(Id)
            if (reqDetail.desc[1] != "Id") {
                return callback(null);
            }
            var expr = "And(RId=" + reqDetail.value[1];
            expr += ",Composite(J.JId=" + basePath[0] +"))";
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
