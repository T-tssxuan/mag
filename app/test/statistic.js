var request = require('request');
var log4js = require('log4js');
var log = log4js.getLogger('crawler');
var async = require('async');

var seds = [Number(process.argv[2]) || 2100837269]; 
var testNumber = Number(process.argv[3]) || 1000;

var baseUrl = "https://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";

var apiUrl = 'http://localhost:3000/';

function getPair(id, testPair, callback) {
    var url = baseUrl;
    url += 'expr=Id=' + id + '&';
    url += 'count=' + 1 + '&';
    url += 'attributes=RId,AA.AuId';
    url += magKey;
    request.get(url, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            var data = JSON.parse(body);
            data = data['entities'];
            if (data['RId'].length > 0) {
                seds.push(data['RId'][0]);
            }
            // Id to Id
            for (var i = 1; i < data['RId'].length; i++) {
                testPair.push([
                    data['RId'][i - 1], data['RId'][i],
                    'Id---->Id'
                ]);
                seds.push(data[i'RId'][i]);
            }
            // AuId to AuId
            for (var i = 1; i < data['AA'].length; i++) {
                testPair.push([
                    data['AA'][i - 1]['AuId'], data['AA'][i]['AuId'],
                    'AuId---->AuId'
                ]);
            }
            // AuId to Id and Id to AuId
            for (var i = 0; i < data['RId'].length; i++) {
                for (var j = 0; j < data['AA'].length; j++) {
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
        callback(testPair);
    });
}

function genTestPair(testPair) {
    if (seds.length > 0 && testPair.length < testNumber) {
        getPair(seds.shift(), testPair, genTestPair);
    }
}

function nextTest(testPair, statistic) {
    var testCase = testPair.shift();
    var url = apiUrl + 'id1=' + testCase[0] + '&id2=' + testCase[1];
    var begin = Date.now();
    request.get(url, function(err, response, body) {
        var end = Date.now();
        var info = '[' + testCase[0] + ', ' + testCase[1] + '] ';
        if (!err && response.statusCode == 200) {
            var re = JSON.parse(body);
            info += 'size: ' + re.length;
            statistic.len.push(re.length);
            statistic.elapse.push(end - begin);
        } else {
            info += 'error ';
        }
        info += 'elapse: ' + end - begin;
        log.info(info);
        nextTest(testPair);
    });
}

function beginTest() {
    var testPair = [];
    var statistic = {
        len: [],
        elapse: []
    };
    async.series([
        function(callback) {
            genTestPair(testPair);
            callback(null);
        },
        function(callback) {
            nextTest(testPair, statistic);
            callback(null);
        }
    ], function(err, result) {
        var maxLen = 0;
        var averageLen = statistic.len.reduce(function(pre, cur) {
            maxLen = maxLen > cur? maxLen : cur;
            return pre + cur;
        }) / statistic.len.length;

        var maxElapse = 0;
        var averageElapse = statistic.elapse.reduce(function(pre, cur) {
            maxElapse = maxElapse > cur? maxElapse : cur;
            return pre + cur;
        }) / statistic.elapse.length;

        log.warn('total: ' + testNumber); 
        log.warn('Length avg: ' + averageLen + ' max: ' + maxLen);
        log.warn('Elapse avg: ' + averageElapse + ' max: ' + maxElapse);
    });
}
