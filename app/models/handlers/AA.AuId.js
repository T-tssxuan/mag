var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-AA.AuId');
var generateOrExpr = require('../generate-or-expr');
var generateAfIdAuIdExpr = require('../generate-afid-auid-expr');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': []
}

var count = 10000;
var smCount = 1;
var limit = 5000;

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
            // AA.AuId->AA.AfId->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            var expr = "Composite(AA.AuId=" + reqDetail.value[1] + ")";
            var attributes = "F.FId,C.CId,AA.AuId,AA.AfId,J.JId,Id,RId";
            var url = magUrlMake(expr, attributes, count);
            // get AfIds
            var AfIds = [];
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err) {
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                            if (data[i].AA[j].AuId == reqDetail.value[1] 
                                && data[i].AA[j].AfId 
                                && AfIds.indexOf(data[i].AA[j].AfId) == -1) {
                                AfIds.push(data[i].AA[j].AfId);
                            }
                        }
                    }
                    var orList = generateAfIdAuIdExpr(basePath, AfIds);
                    async.each(orList, function(item, next) {
                        var url = magUrlMake(item, "AA.AuId,AA.AfId", 34000);
                        tadaRequest(url, reqInfo, function(err, data) {
                            if (!err) {
                                var uniqueHash = {};
                                var AuId,AfId;
                                for (var i = 0; i < data.length; i++) {
                                    for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                        AuId = data[i].AA[j].AuId;
                                        AfId = data[i].AA[j].AfId;
                                        if (AfId && AfIds.indexOf(AfId) != -1 
                                            && basePath.indexOf(AuId) != -1) {
                                            if (!uniqueHash[AfId]) {
                                                uniqueHash[AfId] = [AuId];
                                                result.push([reqDetail.value[0], data[i].AA[j].AuId, 
                                                    data[i].AA[j].AfId, reqDetail.value[1]]);
                                            } else if (uniqueHash[AfId].indexOf(AuId) == -1) {
                                                uniqueHash[AfId].push(AuId);
                                                result.push([reqDetail.value[0], data[i].AA[j].AuId, 
                                                    data[i].AA[j].AfId, reqDetail.value[1]]);
                                            }                                            
                                        }
                                    }
                                }
                            }
                            next(null);
                        });
                    }, function(err) {
                        callback(null);
                    });
                }
            });           
        },
        function(callback) {
            // AA>AuId->Id->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            var expr = "Composite(AA.AuId=" + reqDetail.value[1] + ")";
            var attributes = "F.FId,C.CId,AA.AuId,AA.AfId,J.JId,Id,RId";
            var url = magUrlMake(expr, attributes, count);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err) {
                    var Id, AuId;
                    for (var i = 0; i < data.length; i++) {
                        Id = data[i].Id;
                        for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                            AuId = data[i].AA[j].AuId;
                            if (basePath.indexOf(AuId) != -1) {
                                result.push([reqDetail.value[0], AuId, Id, reqDetail.value[1]]);
                            }
                        }
                    }
                }
                callback(null);
            });
        },
        function(callback) {
            // AA.AuId->Id->RId 2-hop and 3-hop
            if (reqDetail.desc[1] != 'Id') {
                return callback(null);
            }
            var expr = "Id=" + reqDetail.value[1];
            var attributes = "F.FId,C.CId,AA.AuId,J.JId,CC";
            var url = magUrlMake(expr, attributes, smCount);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    // get 2-hop results
                    for (var i = 0; i < data[0].AA.length; i++) {
                        if (basePath.indexOf(data[0].AA[i].AuId) != -1) {
                            result.push([reqDetail.value[0], data[0].AA[i].AuId, 
                                reqDetail.value[1]]);
                        }
                    }
                    if (!Number.isNaN(data[0].CC) && data[0].CC <= 10000) {
                        // get 3-hop results by using prerequest
                        var expr = "RId=" + reqDetail.value[1];
                        var attributes = "F.FId,C.CId,AA.AuId,J.JId,Id";
                        var url = magUrlMake(expr, attributes, count);
                        tadaRequest(url, reqInfo, function(err, data) {
                            var Id, AuId;
                            if (!err) {
                                for (var i = 0; i < data.length; i++) {
                                    Id = data[i].Id;
                                    for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                        AuId = data[i].AA[j].AuId;
                                        if (basePath.indexOf(AuId) != -1) {
                                            result.push([reqDetail.value[0], AuId, Id, reqDetail.value[1]]);
                                        }
                                    }
                                }
                            }
                            callback(null);
                        });
                    } else {
                        // get 3-hop results by using or
                        var orList = generateOrExpr("AA.AuId", basePath, 40);
                        async.each(orList, function(item, next) {
                            var expr = "And(" + item + ",RId=" + reqDetail.value[1] + ")";
                            var url = magUrlMake(expr, "Id,AA.AuId", basePath.length * limit);
                            tadaRequest(url, reqInfo, function(err, data) {
                                if (!err) {
                                    var Id, AuId;
                                    for (var i = 0; i < data.length; i++) {
                                        Id = data[i].Id;
                                        for (var j = 0; data[i].AA && j < data[i].AA.length; j++) {
                                            AuId = data[i].AA[j].AuId;
                                            if (basePath.indexOf(AuId) != -1) {
                                                result.push([reqDetail.value[0], AuId, Id, 
                                                    reqDetail.value[1]]);
                                            }
                                        }
                                    }
                                }
                                next(null);
                            });
                        }, function(err) {
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
