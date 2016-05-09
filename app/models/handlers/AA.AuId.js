var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-AA.AuId');

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
            // AA.AuId->AA.AfId->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            var afidHash = [];
            var readyList = [];
            async.parallel([function(next) {
                var expr = "Composite(AA.AuId=" + reqDetail.value[1] +")";
                var url = magUrlMake(expr, "AA.AuId,AA.AfId", limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            for (var j = 0; j < data[i].AA.length; j++) {
                                if (data[i].AA[j].AuId == reqDetail.value[1] 
                                    && data[i].AA[j].AfId) {
                                    afidHash[data[i].AA[j].AfId] = reqDetail.value[1];
                                }
                            }
                        }
                    }
                    next(null);
                });
            }, function(next) {
                async.each(basePath, function(item, nextcall) {
                    var expr = "Composite(AA.AuId=" + item + ")";
                    var url = magUrlMake(expr, "AA.AuId,AA.AfId", limit);
                    tadaRequest(url, reqInfo, function(err, data) {
                        if (!err) {
                            var afidSet = new Set();
                            for (var i = 0; i < data.length; i++) {
                                for (var j = 0; j < data[i].AA.length; j++) {
                                    if (data[i].AA[j].AuId == item 
                                        && data[i].AA[j].AfId) {
                                        afidSet.add(data[i].AA[j].AfId);
                                    }
                                }
                            }
                            var afidArray = Array.from(afidSet);
                            for (var i = 0; i < afidArray.length; i++) {
                                readyList.push({AuId: item, AfId: afidArray[i]});
                            }
                        }
                        nextcall(null);
                    });
                }, function(err) {
                    next(null);
                });
            }], function(err) {
                for (var i = 0; i < readyList.length; i++) {
                    if (afidHash[readyList[i].AfId]) {
                        result.push([reqDetail.value[0], readyList[i].AuId, 
                            readyList[i].AfId, reqDetail.value[1]]);
                    }
                }
                log.info("AA.AuId->AA.AfId->AA.AuId finished");
                callback(null);
            });
        },
        function(callback) {
            // AA>AuId->Id->AA.AuId(AA.AuId)
            if (reqDetail.desc[1] != 'AA.AuId') {
                return callback(null);
            }
            async.each(basePath, function(item, next) {
                var expr = "And(Composite(AA.AuId=" + item;
                expr += "),Composite(AA.AuId=" + reqDetail.value[1] + "))";
                var url = magUrlMake(expr, "Id", limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            result.push([reqDetail.value[0], item, 
                                data[i].Id, reqDetail.value[1]]);
                        }
                    }
                    next();
                });
            }, function(err) {
                log.info("AA>AuId->Id->AA.AuId finished");
                callback(null)
            });
        },
        function(callback) {
            // AA.AuId->Id 2-hop
            if (reqDetail.desc[1] != 'Id') {
                return callback(null);
            }
            var expr = "Id=" + reqDetail.value[1];
            var url = magUrlMake(expr, "AA.AuId", limit);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    var auidHash = [];
                    for (var i = 0; i < data[0].AA.length; i++) {
                        auidHash[data[0].AA[i].AuId] = reqDetail.value[1];
                    }
                    for (var i = 0; i < basePath.length; i++) {
                        if (auidHash[basePath[i]]) {
                            result.push([reqDetail.value[0], basePath[i], 
                                reqDetail.value[1]]);
                        }
                    }
                }
                callback(null);
            });
        }, function(callback) {
            // AA.AuId->Id->RId 3-hop
            if (reqDetail.desc[1] != 'Id') {
                return callback(null);
            }
            async.each(basePath, function(item, next) {
                var expr = "And(RId=" + reqDetail.value[1];
                expr += ",Composite(AA.AuId=" + item + "))";
                var url = magUrlMake(expr, "Id", limit);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err) {
                        for (var i = 0; i < data.length; i++) {
                            result.push([reqDetail.value[0], item, 
                                data[i].Id, reqDetail.value[1]]);
                        }
                    }
                    next(null);
                })
            }, function(err) {
                log.info("3-hop AA.AuId->Id->RId finished");
                console.log(result);
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
