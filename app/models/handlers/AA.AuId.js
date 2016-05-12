var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-AA.AuId');
var generateOrExpr = require('../generate-or-expr');

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
    // 40 is max(reserveSpace)
    var baseOrList = generateOrExpr("AA.AuId", basePath, 40);
    async.parallel([
        function(callback) {
            // AA.AuId->AA.AfId->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            var AfIdList = {};
            var readyList = {};
            var orList = generateOrExpr("AA.AuId", 
                            basePath.concat([reqDetail.value[1]]), 0);
            async.each(orList, function(item, next) {
                var url = magUrlMake(item, "AA.AuId,AA.AfId", 
                            (basePath.length + 1) * limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        var AuId, AfId;
                        for (var i = 0; i < data.length; i++) {
                            for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                AuId = data[i].AA[j].AuId;
                                AfId = data[i].AA[j].AfId;
                                if (AuId == reqDetail.value[1] && AfId) {
                                    AfIdList[AfId] = AuId;
                                }
                                if (basePath.indexOf(AuId) != -1 && AfId) {
                                    if (!readyList[AfId]) {
                                        readyList[AfId] = [AuId];
                                    } else if (readyList[AfId].indexOf(AuId) == -1) {
                                        readyList[AfId].push(AuId);
                                    }
                                }
                            }
                        }
                    }
                    next(null);
                });
            }, function(err) {
                for (var AfId in readyList) {
                    for (var i = 0; AfIdList[AfId] && i < readyList[AfId].length; i++) {
                        result.push([reqDetail.value[0], readyList[AfId][i], 
                            Number(AfId), reqDetail.value[1]]);
                    }
                }
                callback(null);
            });
        },
        function(callback) {
            // AA>AuId->Id->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            async.each(baseOrList, function(item, next) {
                var expr = "And(" + item + ",Composite(AA.AuId=";
                expr += reqDetail.value[1] + "))";
                var url = magUrlMake(expr, "Id,AA.AuId", limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        var Id, AuId;
                        for (var i = 0; i < data.length; i++) {
                            Id = data[i].Id;
                            for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                AuId = data[i].AA[j].AuId;
                                if (basePath.indexOf(AuId) != -1) {
                                    result.push([reqDetail.value[0], AuId, 
                                        Id, reqDetail.value[1]]);
                                }
                            }
                        }
                    }
                    next(null);
                });
            }, function(err) {
                callback(null);
            });
        },
        function(callback) {
            // AA.AuId->Id->RId 2-hop and 3-hop
            if (reqDetail.desc[1] != 'Id') {
                return callback(null);
            }
            async.each(baseOrList, function(item, next) {
                var expr = "And(" + item + ",Or(Id=" + reqDetail.value[1];
                expr += ",RId=" + reqDetail.value[1] + "))";
                var url = magUrlMake(expr, "Id,AA.AuId", basePath.length * limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        var Id, AuId;
                        for (var i = 0; i < data.length; i++) {
                            Id = data[i].Id;
                            for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                AuId = data[i].AA[j].AuId;
                                if (basePath.indexOf(AuId) != -1) {
                                    if (Id == reqDetail.value[1]) {
                                        result.push([reqDetail.value[0], AuId, Id]);
                                    } else {
                                        result.push([reqDetail.value[0], AuId, 
                                            Id, reqDetail.value[1]]);
                                    }
                                }
                            }
                        }
                    };
                    next(null);
                });
            }, function(err) {
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
