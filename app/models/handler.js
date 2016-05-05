var magUrlMake = require('./mag-url-make');
var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('./tada-request');

var log = log4js.getLogger('handler');

/**
 * Handler constructor
 *
 * @param {Interge} defaultDelay the init delay for request
 * @param {String} id1
 * @param {String} id2
 * @param {Object} res
 */
function Handler(defaultDelay, id1, id2, res) {
    // request info about the timeout of this handle
    // Note: this object need to pass to tadaRequest every time when do request
    this.reqInfo = {
        recievedCount: 0,
        timeoutCount: 0,
        timeout: defaultDelay * 2,
        flag: true,
    }

    // TODO if not a number return immediately
    this.id1 = Number(id1);
    this.id2 = Number(id2);

    // request detail infomation, which need query the mag api
    this.reqDetail = {
        // the describle of the query pair
        // first: the name of the first param
        // second: the name of the second param
        'desc': ['', ''], 
        // the value of the tow query pair
        'value': [0, 0]
    };

    // the express respond handler
    this.res = res;

    // the path search result
    this.result = [];

    log.info('init a Handler with defaultDelay: ' + defaultDelay +
             ' id1: ' + id1 + ' id2: ' + id2);
}

/**
 * Get the detail infomation about the given id pairs, the result can be: 
 *      null, [Id, AA.AuId], [Id, Id], [AA.AuId, AA.AuId], [AA.AuId, Id]
 *      
 * All of the subsequent processing is according to the result of this function.
 */
Handler.prototype.getRequestDetail = function() {
    var validCount = 0;
    var testCount = 0;
    var that = this;

    // the field test function, which decide the field of the id according to 
    // the number of result can get.
    // If there are results in the request, the field is valid.
    var testField = function(field, id, expr, pos) {
        var url = magUrlMake(expr);

        tadaRequest(url, that.reqInfo, function(err, data) {
            if (validCount < 2) {
                if (!err) {
                    // If there is data in this request
                    if (data.length != 0) {
                        that.reqDetail.value[pos - 1] = id;
                        validCount++;
                        that.reqDetail.desc[pos - 1] = field;

                        // If finished check tow parameters start search
                        if (validCount == 2) {
                            log.debug('the search is started');
                            log.debug('request detail: ' 
                                      + JSON.stringify(that.reqDetail));
                            that.startSearch();
                        }
                    }
                } else {
                    log.info('getRequestDetail: get the error data' + data);
                }
            }
            testCount++;
            if (testCount == 4 && validCount != 2) {
                // the pair is not valid, need to send empty result
                that.res.send([]);
            }
        });
    }

    // Test the idx and field
    testField('Id', this.id1, 'Id=' + this.id1, 1);
    testField('AA.AuId', this.id1, 'Composite(AA.AuId=' + this.id1 + ')', 1);
    testField('Id', this.id2, 'Id=' + this.id2, 2);
    testField('AA.AuId', this.id2, 'Composite(AA.AuId=' + this.id2 + ')', 2);
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


/**
 * Start the hop-1 search with the path begin with AA.AuId
 */
Handler.prototype.AAAuIdHop1 = function() {
    var that = this;
    var url = magUrlMake('AA.AuId=' + this.reqDetail.value[0], 'Id,AA,AfId');

    // Get the hop-1 result and generate the rest hops
    tadaRequest(url, this.reqInfo, function(err, data) {
        if (!err) {
            that.beginAAAuId(data);
        } else {
            that.res.send('[]');
        }
    });
}

/**
 * Parallel search the rest hops with the path begin with AA.AuId.
 *
 * @param {Object} data
 */
Handler.prototype.beginAAAuId = function(data) {
    var that = this;

    // Parallel process each element in the data[field]
    var processor = function(elements, field, callback) {
        async.each(elements, function(item, next) {
            if (field == 'Id' && item == that.reqDetail.value[1]) {
                that.result.push([that.reqDetail.value[0], item]);
            }
            // add id->field to the 1 hop resutl
            // call the id->field->*
        }, function(err) {
            callback();
        });
    }

    // Get all paper Id that the AA.AuId published
    var ids = [];
    for (var i = 0; i < data.length; i++) {
        ids.push(data[i]['Id']);
    }

    // Get all field Id that the AA.AuId researched
    var afids = [];
    for (var i = 0; i < data.length; i++) {
        afids.push(data[i]['AfId']);
    }

    // Parallel process each
    async.parallel([
        function(callback) {
            processor(ids, 'Id', callback);
        },
        function(callback) {
            processor(afids, 'AA.AfId', callback);
        },
    ], function (err) {
        that.res.send(JSON.stringify(that.result));
    });
}

/**
 * Start the hop-1 search with the path begin with Id
 */
Handler.prototype.IdHop1 = function(callback) {
    var that = this;
    var url = magUrlMake('Id=' + this.reqDetail.value[0], 
                         'RId,F.FId,C.CId,AA.AuId,J.JId');

    // Get the hop-1 result and generate the rest hops
    tadaRequest(url, this.reqInfo, function(err, data) {
        if (!err) {
            that.beginId(data);
        } else {
            that.res.send('[]');
        }
    });
}

/**
 * Parallel search the rest hops with the path begin with Id
 *
 * @param {Object} data
 */
Handler.prototype.beginId = function(data) {
    var that = this;

    // Parallel process each element in the data[field]
    var processor = function(elements, field, callback) {
        async.each(elements, function(item, next) {
            if ((field == 'RId' && that.reqDetail.value[1] == item)
                || (field == 'AA.AuId' && that.reqDetail.value[1] == item)) {
                that.result.push([that.reqDetail.value[0], item]);
            }
            // add id->field to the 1 hop resutl
            // call the id->field->*
            next();
        }, function(err) {
            callback(null);
        });
    }

    // parallel process each data item of the result and extract correspond
    // field to search the rest hops
    data = data[0];
    async.parallel([
        function(callback) {
            log.info('in the Rid');
            processor(data['RId'], 'RId', callback);
        },
        function(callback) {
            var elements = [];
            for (var j = 0; j < data['AA']; j++) {
                elements.push(data['AA']['AuId']);
            }
            processor(elements, 'AA.AuId', callback);
        },
        function(callback) {
            var elements = [];
            for (var j = 0; j < data['F']; j++) {
                elements.push(data['F']['FId']);
            }
            processor(elements, 'F.FId', callback);
        },
        function(callback) {
            var elements = [];
            for (var j = 0; j < data['C']; j++) {
                elements.push(data['C']['CId']);
            }
            processor(elements, 'C.CId', callback);
        },
        function(callback) {
            var elements = [];
            for (var j = 0; j < data['J']; j++) {
                elements.push(data['J']['JId']);
            }
            processor(elements, 'J.JId', callback);
        }
    ], function (err, result) {
        log.info('finished');
        that.res.send(JSON.stringify(that.result));
    });
}

/**
 * start the handler
 */
Handler.prototype.start = function() {
    log.info('start the Handler for id1: ' + this.id1 + ' id2: ' + this.id2);
    this.getRequestDetail();
}

module.exports = Handler;
