var magUrlMake = require('./mag-url-make');
var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('./tada-request');

var log = log4js.getLogger('handler');

function placeholder(a, b, c, d, e) {
    e();
}

// sub handlers
// TODO change to the 'Id' like style when you export you module
var subHandlers = {
    'AA.AuId': require('./handlers/AA.AuId'),
    'C.CId': placeholder,
    'F.FId': require('./handlers/F.FId'),
    'Id': require('./handlers/Id'),
    'RId': require('./handlers/Id'),
    'J.JId': placeholder,
    'AA.AfId': placeholder
}

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
            log.debug('getRequestDetail: ' + JSON.stringify(data));
            if (!err) {
                // If there is data in this request and has not been set as
                // AA.AuId, we set it.
                // priority of AA.AuId higher than priority of Id
                if (data.length != 0 
                    && that.reqDetail.desc[pos - 1] != 'AA.AuId') {
                    that.reqDetail.value[pos - 1] = id;
                    validCount++;
                    that.reqDetail.desc[pos - 1] = field;
                }
            } else {
                log.info('getRequestDetail: get the error data' + data);
            }
            testCount++;
            
            // At most 4 result
            if (testCount == 4) {
                // check whether get an validate pair
                if (that.reqDetail.desc[0] != '' 
                    && that.reqDetail.desc[1] != '') {
                    log.info('the search is started');
                    log.debug('request detail: '
                              + JSON.stringify(that.reqDetail));
                    that.startSearch();
                } else {
                    // the pair is not valid, need to send empty result
                    log.info('not find valid query pair');
                    that.sendResult();
                }
            }
        }, 10);
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

Handler.prototype.processSubPath = function(field, elements, callback) {
    log.debug('field: ' + field + ' elements: ' + JSON.stringify(elements));
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
    var url = magUrlMake('AA.AuId=' + this.reqDetail.value[0], 'Id,AA,AfId');

    // Get the hop-1 result and generate the rest hops
    tadaRequest(url, this.reqInfo, function(err, data) {
        if (!err) {
            that.beginAAAuId(data);
        } else {
            that.sendResult();
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

    // Get all paper Id that the AA.AuId published
    data = data[0];

    // Parallel process each path
    async.parallel([
        function(callback) {
            var ids = [];
            for (var i = 0; i < data.length; i++) {
                ids.push(data[i]['Id']);

                // If the Id fullfil the query pair, push it into the result
                if (data[i]['Id'] == that.reqDetail.value[1]) {
                    that.result.push([that.reqDetail.value[0], data[i]['Id']]);
                }
            }
            that.processSubPath('Id', ids, callback);
        },
        function(callback) {
            // Get all field Id that the AA.AuId researched
            var afids = [];
            for (var i = 0; i < data.length; i++) {
                afids.push(data[i]['AfId']);
            }
            that.processSubPath('AA.AfId', afids, callback);
        },
    ], function (err) {
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
        if (!err) {
            that.beginId(data);
        } else {
            that.sendResult();
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
    log.info('finished');
    var re = "size: " + this.result.length + " ---->";
    re += JSON.stringify(this.result);
    this.res.send(re);
}

/**
 * start the handler
 */
Handler.prototype.start = function() {
    log.info('start the Handler for id1: ' + this.id1 + ' id2: ' + this.id2);
    this.getRequestDetail();
}

module.exports = Handler;
