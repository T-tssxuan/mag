var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-RId');

var generateOrExpr = require('../generate-or-expr');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': [],
    'AA.AuId': ['AA.AuId', 'Id']
}

var offsets = [];

for (var i = 0; i < 20; i++) {
    offsets.push(i * 10000);
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
function searchPathMain(reqInfo, reqDetail, result, callback) {
    log.debug('Search Path: Id->RId->RId->*');
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    var idData = [];
    var auidData = [];
    var ridData = [];
    var lastIdData = [];
    async.parallel([
        function(next) {
            // Get all AuId->RId the RId infomation
            log.info('in the AuId -> Id');
            var expr = 'Composite(AA.AuId=' + Id1 + ')';
            var attribute = 'AA.AuId,J.JId,C.CId,F.FId,RId,Id';
            var url = magUrlMake(expr, attribute, 10000);
            tadaRequest(url, reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    idData = data;
                    if (reqDetail.desc[1] == 'Id') {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i]['RId'] 
                                && data[i]['RId'].indexOf(Id2) != -1) {
                                result.push([Id1, data[i]['Id'], Id2]);
                            }
                            if (data[i]['Id'] == Id2) {
                                result.push([Id1, Id2]);
                            }
                        }
                    }
                }
                next(null);
            });
        },
        function(next) {
            // Id->Id->Id->AA.AuId
            if (reqDetail.desc[1] == 'AA.AuId') {
                var expr = 'Composite(AA.AuId=' + Id2 + ')';
                var url = magUrlMake(expr, 'Id', 10000);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err && data.length > 0) {
                        auidData = data;
                    }
                    next(null);
                });
            } else {
                next(null);
            }
        }, 
        function(next) {
            // Id->Id->Id->Id
            if (reqDetail.desc[1] == 'Id') {
                var url = magUrlMake('Id=' + Id2, 'CC', 1);
                tadaRequest(url, reqInfo, function(err, data) {
                    var items = [];
                    var idx = 20;
                    if (!err && data.length > 0 
                        && !Number.isNaN(data[0]['CC'])) {
                        idx = Math.ceil(data[0]['CC'] / 10000);
                    }
                    log.info('items: ' + idx);
                    for (var i = 0; i < idx; i++) {
                        items.push(offsets[i]);
                    }
                    async.each(items, function(item, finish) {
                        var expr = 'RId=' + Id2;
                        var url = magUrlMake(expr, 'Id' , 10000, item);
                        tadaRequest(url, reqInfo, function(err, data) {
                            if (!err && data.length > 0) {
                                ridData = ridData.concat(data);
                            }
                            finish(null);
                        }, 0, 1);
                    }, function(err) {
                        next(null);
                    });
                });
            } else {
                next(null);
            }
        },
        function(next) {
            // Id->Id->(J.JId,C.CId,F.FId,AA.AuId)->Id
            if (reqDetail.desc[1] == 'Id') {
                var attribute = 'AA.AuId,J.JId,C.CId,F.FId';
                var expr = 'Id=' + reqDetail.value[1];
                var url = magUrlMake(expr, attribute);
                tadaRequest(url, reqInfo, function(err, data) {
                    if (!err && data.length > 0) {
                        lastIdData = data;
                    }
                    next(null);
                });
            } else {
                next(null);
            }
        }
    ], function() {
        if (reqDetail.desc[1] == 'Id') {
            process1(reqDetail, result, ridData, idData);
            process2(reqDetail, result, lastIdData, idData);
        } else {
            process1(reqDetail, result, auidData, idData);
        }
        callback(null);
    });
}

// Id->Id->Id->AA.AuId
// Id->Id->Id-Id
function process1(reqDetail, result, data, idData) {
    var map = {};
    for (var i = 0; i < data.length; i++) {
        map[data[i]['Id']] = 1;
    }
    for (var i = 0; i < idData.length; i++) {
        for (var j = 0; j < idData[i]['RId'].length; j++) {
            if (map[idData[i]['RId'][j]]) {
                result.push([
                    reqDetail.value[0],
                    idData[i]['Id'],
                    idData[i]['RId'][j],
                    reqDetail.value[1]
                ]);
            }
        }
    }
}

// Id->Id->(J.JId,C.CId,F.FId,AA.AuId)->Id
function process2(reqDetail, result, lastIdData, idData) {
    processAuFId(result, reqDetail, idData, lastIdData[0], 'AA', 'AuId');
    processAuFId(result, reqDetail, idData, lastIdData[0], 'F', 'FId');
    processJCId(result, reqDetail, idData, lastIdData[0], 'J', 'JId');
    processJCId(result, reqDetail, idData, lastIdData[0], 'C', 'CId');
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
        if (!from[i][field1]) {
            continue;
        }
        for (var j = 0; j < from[i][field1].length; j++) {
            if (map[from[i][field1][j][field2]]) {
                result.push([
                    reqDetail.value[0],
                    from[i]['Id'],
                    from[i][field1][j][field2],
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
        if (!from[i][field1]) {
            continue;
        }
        if (from[i][field1][field2] == to[field1][field2]) {
            result.push([
                reqDetail.value[0],
                from[i]['Id'],
                from[i][field1][field2],
                reqDetail.value[1]
            ]);
        }
    }
}
function process2Hop(reqInfo, reqDetail, result, callback) {
    if (reqDetail.desc[1] != 'AA.AuId') {
        return callback(null);
    }
    log.info('in the AA.AuId -> Id -> AA.AuId');
    var expr = 'And(Composite(AA.AuId=' + reqDetail.value[0] + '),';
    expr += 'Composite(AA.AuId=' + reqDetail.value[1] + '))';
    var url = magUrlMake(expr, 'Id', 10000);
    tadaRequest(url, reqInfo, function(err, data) {
        if (!err && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                result.push([
                    reqDetail.value[0],
                    data[i]['Id'],
                    reqDetail.value[1]
                ]);
            }
        }
        callback(null);
    });
}

function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
    async.parallel([
        function(callback) {
            process2Hop(reqInfo, reqDetail, result, callback);
        },
        function(callback) {
            searchPathMain(reqInfo, reqDetail, result, callback);
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
    log.info('AuId_Id.js' + JSON.stringify(reqDetail));
    if (adatper[reqDetail.desc[0]].indexOf(reqDetail.desc[1]) == -1) {
        cbFunc();
    } else {
        log.info('AuId_Id.js');
        searchPath(reqInfo, reqDetail, result, basePath, cbFunc);
    }
}
