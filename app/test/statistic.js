/**
 * Note:
 *     node statistic.js sed_id number_of_test_case
 * 通过提供初始id，以及测试case来开始测式，不提供参数则使用默认参数
 */
var request = require('request');
var log4js = require('log4js');
var log = log4js.getLogger('crawler');
var async = require('async');

var seds = [Number(process.argv[2]) || 2100837269]; 
for (var i = 3; i < process.argv.length - 1; i++) {
    seds.push(Number(process.argv[i]));
}
var testNumber = 500;
if (process.argv.length >= 4) {
    testNumber = Number(process.argv[process.argv.length - 1]);
}

log.info(seds);
log.info("testNumber: " +  testNumber)

var baseUrl = "https://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";

var apiUrl = 'http://tada.chinacloudapp.cn:3000/?';
// var apiUrl = 'http://localhost:3000/?';

/**
 * Generate test case pair
 *
 * @param {Array} testPair
 * @param {Function} callback
 */
function genTestPair(testPair, callback) {
    if (seds.length <= 0 || testPair.length >= testNumber) {
        return callback(null);
    }
    var id = seds.shift();

    var url = baseUrl;
    url += 'expr=Id=' + id + '&';
    url += 'count=' + 1 + '&';
    url += 'attributes=RId,AA.AuId';
    url += magKey;
    request.get(url, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var data = JSON.parse(body);
            data = data['entities'][0];
            if (data['RId'] && data['RId'].length > 0) {
                seds.push(data['RId'][0]);
            }
            // Id to Id
            for (var i = 1; data['RId'] && i < data['RId'].length; i++) {
                testPair.push([
                    data['RId'][i - 1], data['RId'][i],
                    'Id---->Id'
                ]);
                seds.push(data['RId'][i]);
            }
            // AuId to AuId
            for (var i = 1; data['AA'] && i < data['AA'].length; i++) {
                testPair.push([
                    data['AA'][i - 1]['AuId'], data['AA'][i]['AuId'],
                    'AuId---->AuId'
                ]);
            }
            // AuId to Id and Id to AuId
            for (var i = 0; data['RId'] && i < data['RId'].length; i++) {
                for (var j = 0; data['AA'] && j < data['AA'].length; j++) {
                    testPair.push([
                        data['RId'][i], data['AA'][j]['AuId'],
                        'Id---->AuId'
                    ]);
                    testPair.push([
                        data['AA'][j]['AuId'], data['RId'][i],
                        'AuId---->Id'
                    ]);
                }
            }
        }
        genTestPair(testPair, callback);
    });
}

/**
 * Begin next test case
 *
 * @param {Array} testPair
 * @param {Obj} statistic
 * @param {callback} callback
 */
function nextTest(testPair, statistic, callback) {
    if (testPair.length <= 0) {
        return callback(null);
    }
    var testCase = testPair.shift();
    var url = apiUrl + 'id1=' + testCase[0] + '&id2=' + testCase[1];
    var begin = Date.now();
    log.info('Left case: ' + testPair.length);
    request.get(url, function(err, response, body) {
        var end = Date.now();
        var info = '[' + testCase[0] + ', ' + testCase[1] + '] \t';
        info += testCase[2] + ' \t';
        if (!err && response.statusCode == 200) {
            var re = JSON.parse(body);
            info += 'size: ' + re.length + ' \t';
            statistic.len.push(re.length);
            statistic.elapse.push(end - begin);
        } else {
            info += 'error \t';
        }
        info += ' elapse: ' + (end - begin);
        log.info(info);
        nextTest(testPair, statistic, callback);
    });
}

/**
 * Begin the test case.
 */
function beginTest() {
    var testPair = [];
    var statistic = {
        len: [],
        elapse: []
    };
    async.series([
        function(callback) {
            log.info('Begin generate test pairs');
            genTestPair(testPair, callback);
        },
        function(callback) {
            log.info('Begin test');
            nextTest(testPair, statistic, callback);
        }
    ], function(err, result) {
        log.warn('total: ' + testNumber); 
        if (statistic.len.length > 0) {
            var lenNum = statistic.len.length;
            statistic.len.sort(function(a, b) { return a - b;});
            var averageLen = statistic.len.reduce(function(pre, cur) {
                return pre + cur;
            }) / statistic.len.length;

            log.warn('Length avg: ' + averageLen);
            log.warn('80% len: ' + statistic.len[Math.floor(lenNum * 0.80)]);
            log.warn('85% len: ' + statistic.len[Math.floor(lenNum * 0.85)]);
            log.warn('90% len: ' + statistic.len[Math.floor(lenNum * 0.90)]);
            log.warn('95% len: ' + statistic.len[Math.floor(lenNum * 0.95)]);
            log.warn('97% len: ' + statistic.len[Math.floor(lenNum * 0.97)]);
            log.warn('99% len: ' + statistic.len[Math.floor(lenNum * 0.99)]);
            log.warn('max len: ' + statistic.len[lenNum - 1]);

            var elapseNum = statistic.elapse.length;
            statistic.elapse.sort(function(a, b) { return a - b;});
            var averageElapse = statistic.elapse.reduce(function(pre, cur) {
                return pre + cur;
            }) / statistic.elapse.length;

            log.warn('Elapse avg: ' + averageElapse);
            log.warn('80% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.80)]);
            log.warn('85% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.85)]);
            log.warn('90% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.90)]);
            log.warn('95% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.95)]);
            log.warn('97% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.97)]);
            log.warn('99% elapse: ' + statistic.elapse[Math.floor(elapseNum * 0.99)]);
            log.warn('max elapse: ' + statistic.elapse[elapseNum - 1]);
        }
    });
}

beginTest();
