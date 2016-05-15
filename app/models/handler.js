var magUrlMake = require('./mag-url-make');
var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('./tada-request');
var preRequest = require('./prerequest.js');

var log = log4js.getLogger('handler');

function placeholder(a, b, c, d, e) {
    e();
}

// sub handlers
// TODO change to the 'Id' like style when you export you module
var subHandlers = {
    'AA.AuId': require('./handlers/AA.AuId'),
    'C.CId': require('./handlers/C.CId'),
    'F.FId': require('./handlers/F.FId'),
    'Id': require('./handlers/Id'),
    'RId': require('./handlers/Id'),
    'J.JId': require('./handlers/J.JId'),
    'AA.AfId': require('./handlers/AA.AfId'),
    'AuId_Id': require('./handlers/AuId_Id')
}

/**
 * Handler constructor
 *
 * @param {Interge} defaultDelay the init delay for request
 * @param {String} id1
 * @param {String} id2
 * @param {Object} res
 */
function Handler(defaultDelay, id1, id2, res, cache) {
    defaultDelay = defaultDelay > 200? defaultDelay : 200;
    defaultDelay = defaultDelay < 5000? defaultDelay : 5000;
    // request info about the timeout of this handle
    // Note: this object need to pass to tadaRequest every time when do request
    this.reqInfo = {
        receivedCount: 0,
        timeoutCount: 0,
        timeout: defaultDelay * 2,
        flag: true,
        urlCache: cache
    }

    // the express respond handler
    this.res = res;

    // the path search result
    this.result = [];

    // TODO if not a number return immediately
    this.id1 = Number(id1);
    this.id2 = Number(id2);
    if (Number.isNaN(this.id1) || Number.isNaN(this.id2)) {
        this.invalid = true;
        return;
    }

    // request detail infomation, which need query the mag api
    this.reqDetail = {
        // the describle of the query pair
        // first: the name of the first param
        // second: the name of the second param
        'desc': ['', ''], 
        // the value of the tow query pair
        'value': [0, 0]
    };

    preRequest(this.id1, this.id2, this.reqInfo.urlCache);
}

/**
 * Get the detail infomation about the given id pairs, the result can be: 
 *      null, [Id, AA.AuId], [Id, Id], [AA.AuId, AA.AuId], [AA.AuId, Id]
 *      
 * All of the subsequent processing is according to the result of this function.
 */
Handler.prototype.getRequestDetail = function() {
    var that = this;
    var testField = function (target, idx, lock, callback) {
        var expr = 'Or(Id=' + target + ',';
        expr += 'Composite(AA.AuId=' + target + '))';
        var url = magUrlMake(expr);
        tadaRequest(url, that.reqInfo, function(err, data) {
            log.info('testField lock: ' + lock.flag);
            log.info('testField: ' + idx + ' time: ' + Date.now());
            if (lock.flag == 0) {
                if (!err && data.length > 0) {
                    that.reqDetail.value[idx] = target;
                    if (data.length > 1) {
                        that.reqDetail.desc[idx] = 'AA.AuId';
                    } else {
                        that.reqDetail.desc[idx] = 'Id';
                    }
                    callback(null);
                } else {
                    callback('error'); 
                }
                lock.flag = 1;
            }
        });
    };

    async.parallel([
        function(callback) {
            var test1 = {flag: 0};
            testField(that.id1, 0, test1, callback);
            setTimeout(function() {
                testField(that.id1, 0, test1, callback);
            }, 200);
        },
        function(callback) {
            var test2 = {flag: 0};
            testField(that.id2, 1, test2, callback);
            setTimeout(function() {
                testField(that.id2, 1, test2, callback);
            }, 200);
        }
    ], function(err) {
        if (err) {
            that.sendResult();
        } else {
            log.info('request detail: ' + JSON.stringify(that.reqDetail));
            that.startSearch();
        }
    });
}

/**
 * Start the path search, according to the first element of the search pair
 */
Handler.prototype.startSearch = function() {
    if (this.reqDetail.desc[0] == 'Id') {
        this.IdHop1();
    } else {
        this.AAAuIdHop1();
    }
}

Handler.prototype.processSubPath = function(field, elements, callback) {
    log.debug('field: ' + field + ' elements: ' + JSON.stringify(elements));
    if (elements.length == 0 && field != 'AuId_Id') {
        return callback(null);
    }
    subHandlers[field](
        this.reqInfo,
        this.reqDetail,
        this.result,
        elements,
        callback
    );
}


/**
 * Start the hop-1 search with the path begin with AA.AuId
 */
Handler.prototype.AAAuIdHop1 = function() {
    var that = this;
    var expr = 'Composite(AA.AuId=' + this.reqDetail.value[0] + ')';
    var url = magUrlMake(
        expr, 
        'AA.AuId,AA.AfId,J.JId,C.CId,F.FId,RId,Id',
        10000
    );

    // Get the hop-1 result and generate the rest hops

    async.parallel([
        function(callback) {
            tadaRequest(url, that.reqInfo, function(err, data) {
                if (!err && data.length > 0) {
                    var afids = [];
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i]['AA'].length; j++) {
                            if (data[i]['AA'][j]['AuId'] == that.id1) {
                                if (data[i]['AA'][j]['AfId'] 
                                    && afids.indexOf(data[i]['AA'][j]['AfId']) == -1) {
                                    afids.push(data[i]['AA'][j]['AfId']);
                                }
                                break;
                            }
                        }
                    }
                    log.debug('afids: ' + afids);
                    if (afids.length > 0) {
                        that.processSubPath('AA.AfId', afids, callback);
                    } else {
                        callback(null);
                    }
                } else {
                    callback(null);
                }
            });
        },
        function(callback) {
            that.processSubPath('AuId_Id', [], callback);
        }
    ], function(err) {
        that.sendResult();
    });
}

/**
 * Start the hop-1 search with the path begin with Id
 */
Handler.prototype.IdHop1 = function(callback) {
    var that = this;
    var url = magUrlMake(
        'Id=' + this.reqDetail.value[0], 
        'RId,F.FId,C.CId,AA.AuId,J.JId'
    );

    // Get the hop-1 result and generate the rest hops
    tadaRequest(url, this.reqInfo, function(err, data) {
        if (!err && data.length > 0) {
            that.beginId(data);
        } else {
            that.sendResult();
        }
    }, 1000);
}

/**
 * Parallel search the rest hops with the path begin with Id
 *
 * @param {Object} data
 */
Handler.prototype.beginId = function(data) {
    var that = this;

    // parallel process each data item of the result and extract correspond
    // field to search the rest hops
    data = data[0];
    async.parallel([
        function(callback) {
            if (!data['RId']) {
                return callback(null);
            }

            var rids = [];
            for (var i = 0; i < data['RId'].length; i++) {
                rids.push(data['RId'][i]);

                // check if there is the 1-hop result
                if (data['RId'][i] == that.id2) {
                    that.result.push([that.id1, that.id2]);
                }
            }

            that.processSubPath('RId', rids, callback);
        },
        function(callback) {
            if (!data['AA']) {
                return callback(null);
            }

            var auids = [];
            for (var j = 0; j < data['AA'].length; j++) {
                auids.push(data['AA'][j]['AuId']);

                // check if there is the 1-hop result
                if (data['AA'][j]['AuId'] == that.id2) {
                    that.result.push([that.id1, that.id2]);
                }
            }

            that.processSubPath('AA.AuId', auids, callback);
        },
        function(callback) {
            if (!data['F']) {
                return callback(null);
            }

            var fids = [];
            for (var j = 0; j < data['F'].length; j++) {
                fids.push(data['F'][j]['FId']);
            }

            that.processSubPath('F.FId', fids, callback);
        },
        function(callback) {
            if (!data['C']) {
                return callback(null);
            }

            var cids = [data['C']['CId']];

            that.processSubPath('C.CId', cids, callback);
        },
        function(callback) {
            if (!data['J']) {
                return callback(null);
            }

            var jids = [data['J']['JId']];

            that.processSubPath('J.JId', jids, callback);
        }
    ], function (err, result) {
        that.sendResult();
    });
}

Handler.prototype.sendResult = function() {
    log.info('finished size: ' + this.result.length);
    var re = JSON.stringify(this.result);
    this.res.send(re);
}

/**
 * start the handler
 */
Handler.prototype.start = function() {
    if (this.invalid) {
        log.info('send result for invalid request');
        this.sendResult();
        return;
    }
    log.info('start the Handler for id1: ' + this.id1 + ' id2: ' + this.id2);
    this.getRequestDetail();
}

module.exports = Handler;
