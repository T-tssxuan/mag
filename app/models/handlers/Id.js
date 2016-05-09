var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-RId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': ['AA.AuId', 'Id']
}

/*
 * search Path Id->RId->RId or Id->RId->RId->AuId
 *
 * @param {Object} reqInfo
 * @param {Object} reqDetail
 * @param {Array} result
 * @param {Number} Id
 * @param {Function} callback
 */
function searchPath5(reqInfo, reqDetail, result, Ids, callback) {
    log.debug('Search Path: Id->RId->RId->*');
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    var expr = '';
    if (reqDetail.desc[1] == 'Id') {
        // search Id->RId->RId(->RId) 2-hop and 3-hop
        expr = 'RId=' + Id2;
    } else {
        // search RId->RId->RId->AA.AuId 3-hop
        expr = 'Composite(AA.AuId=' + Id2 + ')';
    }
    async.parallel([
        function(finish) {
            var elements = [];
            async.each(Ids, function(item, next) {
                var url = magUrlMake('Id=' + item, 'RId');
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err && data.length > 0 && data[0]['RId']) {
                        if (reqDetail.desc[1] == 'Id'
                            && data[0]['RId'].indexOf(Id2) != -1) {
                            result.push([Id1, item, Id2]);
                        }
                        elements.push([item, data[0]['RId']]);
                    }
                    next(null);
                });
            }, function() {
                finish(null, elements);
            });
        },
        function(finish) {
            var url = magUrlMake(expr, 'Id', 10000);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    finish(null, data);
                } else {
                    finish(null, []);
                }
            });
        }
    ], function(err, data) {
        if (data[0].length <= 0 || data[1].length <= 0) {
            return callback(null);
        } 
        var map = {};
        for (var i = 0; i < data[1].length; i++) {
            map[data[1][i]['Id']] = 1;
        }
        for (var i = 0; i < data[0].length; i++) {
            for (var j = 0; j < data[0][i][1].length; j++) {
                if (map[data[0][i][1][j]]) {
                    result.push([Id1, data[0][i][0], data[0][i][1][j], Id2]);
                }
            }
        }
        log.debug('size: ' + result.length);
        callback(null);
    });
}

function process3Hop(reqInfo, reqDetail, result, ids, callback) {
    var attribute = 'AA.AuId,J.JId,C.CId,F.FId';
    async.parallel([
        function(finish) {
            var idsData = [];
            async.each(ids, function(item, next) {
                var expr = 'Id=' + item;
                var url = magUrlMake(expr, attribute);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err && data.length > 0) {
                        idsData.push([item, data[0]]);
                    }
                    next(null);
                });
            }, function(err) {
                finish(null, idsData);
            });
        }, 
        function(finish) {
            var expr = 'Id=' + reqDetail.value[1];
            var url = magUrlMake(expr, attribute);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    finish(null, data[0]);
                } else {
                    finish(null, null);
                }
            });
        }
    ], function(err, data) {
        processAuFId(result, reqDetail, data[0], data[1], 'AA', 'AuId');
        processAuFId(result, reqDetail, data[0], data[1], 'F', 'FId');
        processJCId(result, reqDetail, data[0], data[1], 'J', 'JId');
        processJCId(result, reqDetail, data[0], data[1], 'C', 'CId');
        callback(null);
    });
}

function processAuFId(result, reqDetail, from, to, field1, field2) {
    var map = {};
    if (!to || !to[field1]) {
        return;
    }
    for (var i = 0; i < to[field1].length; i++) {
        map[to[field1][i][field2]] = 1;
    }
    for (var i = 0; i < from.length; i++) {
        if (!from[i][1][field1]) {
            continue;
        }
        for (var j = 0; j < from[i][1][field1].length; j++) {
            if (map[from[i][1][field1][j][field2]]) {
                result.push([
                    reqDetail.value[0],
                    from[i][0],
                    from[i][1][field1][j][field2],
                    reqDetail.value[1]
                ]);
            }
        }
    }
}
function processJCId(result, reqDetail, from, to, field1, field2) {
    var map = {};
    if (!to || !to[field1]) {
        return;
    }
    for (var i = 0; i < from.length; i++) {
        if (!from[i][1][field1]) {
            continue;
        }
        if (from[i][1][field1][field2] == to[field1][field2]) {
            result.push([
                reqDetail.value[0],
                from[i][0],
                from[i][1][field1][field2],
                reqDetail.value[1]
            ]);
        }
    }
}

function process2Hop(reqInfo, reqDetail, result, ids, callback) {
    var expr = 'Composite(AA.AuId=' + reqDetail.value[1] + ')';
    var url = magUrlMake(expr, 'Id', 10000);
    tadaRequest(url, reqInfo, function(err, data) {
        if (!err && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                if (ids.indexOf(data['Id']) != -1) {
                    result.push([
                        reqDetail.value[0],
                        data['Id'],
                        reqDetail.value[1]
                    ]);
                }
            }
        }
        callback(null);
    });
}

function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
    async.parallel([
        function(callback) {
            if (reqDetail.desc[1] == 'AA.AuId') {
                process2Hop(reqInfo, reqDetail, result, basePath, callback);
            } else {
                process3Hop(reqInfo, reqDetail, result, basePath, callback);
            }
        },
        function(callback) {
            // Id->RId->RId->(AA.AuId, Id)
            searchPath5(reqInfo, reqDetail, result, basePath, callback);
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
    // return cbFunc();
    // Before search path check whether this module suitable for query pair
    if (adatper[reqDetail.desc[0]].indexOf(reqDetail.desc[1]) == -1) {
        cbFunc();
    } else {
        searchPath(reqInfo, reqDetail, result, basePath, cbFunc);
    }
}
