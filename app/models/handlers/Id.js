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

function searchTowAndCompare(url1, url2, reqInfo, callback) {
    async.parallel([
        function (finish) {
            tadaRequest(url1, reqInfo, function(err, data) {
                finish(err, data);
            });
        },
        function (finish) {
            tadaRequest(url2, reqInfo, function(err, data) {
                finish(err, data);
            });
        }
    ], function(err, result) {
        callback(err, result);
    });
}

/*
 * search Path Id->RId->AA.AuId or Id->RId->AA.AuId->Id
 *
 * @param {Object} reqInfo
 * @param {Object} reqDetail
 * @param {Array} result
 * @param {Number} Id
 * @param {Function} callback
 */
function searchPath1(reqInfo, reqDetail, result, Id, callback) {
    log.debug('Search Path: Id->AA.AuId->Id');
    var expr = '';
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    if (reqDetail.desc[1] == 'AA.AuId') {
        // search Id->RId->AA.AuId
        expr = 'And(Id=' + Id + ',';
        expr += 'Composite(AA.AuId=' + Id2 + '))';
        tadaRequest(magUrlMake(expr), reqInfo, function(err, data) {
            if (!err && data.length != 0) {
                log.debug('Id->AA.AuId data length: ' + data.length);
                result.push([Id1, Id, Id2]);
                log.debug('Id->RId->AA.AuId: [' + Id1 + ',' + Id + ',' + Id2 
                          + ']');
            }
            callback(null);
        });
    } else {
        // search Id->RId->AA.AuId->Id
        var url1 = magUrlMake('Id=' + Id, 'AA.AuId', 1);
        var url2 = magUrlMake('Id=' + Id2, 'AA.AuId', 1);
        searchTowAndCompare(url1, url2, reqInfo, function(err, result) {
            if (err || result[0].length == 0 || result[1].length == 0) {
                return callback(null);
            }
            if (!result[0]['AA'] || !result[1]['AA']) {
                return callback(null);
            }
            var tmp = {};
            var arr1 = result[0]['AA'];
            var arr2 = result[1]['AA'];
            for (var i = 0; i < arr1.length; i++) {
                tmp[arr1[i]['AuId']] = 1;
            }
            for (var i = 0; i < arr2.length; i++) {
                if (tmp[arr2[i]['AuId']]) {
                    result.push([Id1, Id, arr2[i]['AuId'], Id2]);
                    log.debug('Id->RId->AA.AuId->Id: [' + Id1 + ', ' + Id 
                              + ', ' + arr2[i]['AuId'] + ', ' + Id2 + ']');
                }
            }
            callback(null);
        });
    }
}

/*
 * search Path Id->RId->J.JId->Id
 *
 * @param {Object} reqInfo
 * @param {Object} reqDetail
 * @param {Array} result
 * @param {Number} Id
 * @param {Function} callback
 */
function searchPath2(reqInfo, reqDetail, result, Id, callback) {
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    var url1 = magUrlMake('Id=' + Id, 'J.JId', 1);
    var url2 = magUrlMake('Id=' + Id2, 'J.JId', 1);
    searchTowAndCompare(url1, url1, reqInfo, function(err, result) {
        if (err || result[0].length == 0 || result[1].length == 0) {
            return callback(null);
        }
        if (!result[0]['J'] || !result[1]['J']) {
            return callback(null);
        }
        if (result[0]['J']['JId'] == result[1]['J']['JId']) {
            result.push([Id1, Id, result[0]['J']['JId'], Id2]);
        }
        callback(null);
    });
}

/*
 * search Path Id->RId->C.CId->Id
 *
 * @param {Object} reqInfo
 * @param {Object} reqDetail
 * @param {Array} result
 * @param {Number} Id
 * @param {Function} callback
 */
function searchPath3(reqInfo, reqDetail, result, Id, callback) {
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    var url1 = magUrlMake('Id=' + Id, 'C.CId', 1);
    var url2 = magUrlMake('Id=' + Id2, 'C.CId', 1);
    searchTowAndCompare(url1, url1, reqInfo, function(err, result) {
        if (err || result[0].length == 0 || result[1].length == 0) {
            return callback(null);
        }
        if (!result[0]['C'] || !result[1]['C']) {
            return callback(null);
        }
        if (result[0]['C']['CId'] == result[1]['C']['CId']) {
            result.push([Id1, Id, result[0]['C']['CId'], Id2]);
        }
        callback(null);
    });
}

/*
 * search Path Id->RId->F.FId->Id
 *
 * @param {Object} reqInfo
 * @param {Object} reqDetail
 * @param {Array} result
 * @param {Number} Id
 * @param {Function} callback
 */
function searchPath4(reqInfo, reqDetail, result, Id, callback) {
    var Id1 = reqDetail.value[0];
    var Id2 = reqDetail.value[1];
    var url1 = magUrlMake('Id=' + Id, 'F.FId', 100);
    var url2 = magUrlMake('Id=' + Id2, 'F.FId', 100);
    searchTowAndCompare(url1, url1, reqInfo, function(err, result) {
        if (err || result[0].length == 0 || result[1].length == 0) {
            return callback(null);
        }
        if (!result[0]['F'] || !result[1]['F']) {
            return callback(null);
        }
        var tmp = {};
        var arr1 = result[0]['F'];
        var arr2 = result[1]['F'];
        for (var i = 0; i < arr1.length; i++) {
            tmp[arr1[i]['FId']] = 1;
        }
        for (var i = 0; i < arr2.length; i++) {
            if (tmp[arr2[i]['FId']]) {
                result.push([Id1, Id, arr2[i]['FId'], Id2]);
                log.debug('Id->RId->F.FId->Id: [' + Id1 + ', ' + Id 
                          + ', ' + arr2[i]['FId'] + ', ' + Id2 + ']');
            }
        }
        callback(null);
    });
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
                            result.push(Id1, item, Id2);
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
    ], function(err, result) {
        if (result[0].length <= 0 || result[1].length <= 0) {
            return callback(null);
        } 
        log.debug('process Id->RId->RId->(RId, AA.AuId)');
        var map = {};
        for (var i = 0; i < result[0].length; i++) {
            map = {};
            for (var j = 0; j < result[0][i][1].length; j++) {
                map[result[0][i][1][j]] = 1;
            }
            for (var j = 0; j < result[1].length; j++) {
                if (map[result[1][j]['Id']]) {
                    result.push(Id1, result[0][i][0], result[1][j]['Id'], Id2);
                }
            }
        }
        callback(null);
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
function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
    async.parallel([
        function(callback) {
            async.each(basePath, function(item, finish) {
                searchPath1(reqInfo, reqDetail, result, item, finish);
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            // Id->RId->J.JId->Id
            async.each(basePath, function(item, finish) {
                searchPath2(reqInfo, reqDetail, result, item, finish);
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            // Id->RId->C.CId->Id
            async.each(basePath, function(item, finish) {
                searchPath3(reqInfo, reqDetail, result, item, finish);
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            // Id->RId->F.FId->Id
            async.each(basePath, function(item, finish) {
                searchPath4(reqInfo, reqDetail, result, item, finish);
            }, function(err) {
                callback(err);
            });
        },
        function(callback) {
            // Id->RId->AA.AuId->(AA.AuId, Id)
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
