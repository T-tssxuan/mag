var log4js = require('log4js');
var log = log4js.getLogger('Test');
var fs = require('fs');

function beginTest() {
    log.info(JSON.stringify(process.argv));
    if (process.argv.length <= 2) {
        var files = fs.readdirSync('.');
        log.info(JSON.stringify(files));
        var re = /^\..*$/;
        for (var i = 0; i < files.length; i++) {
            if (!re.test(files[i]) 
                && files[i] != 'test.js' 
                && files[i] != 'sample.js') {
                testUnit(files[i].slice(0, -3));
            }
        }
    } else {
        for (var i = 2; i < process.argv.length; i++) {
            testUnit(process.argv[i]);
        }
    }
}

function testUnit(val) {
    log = log4js.getLogger('Test ' + val);
    log.info(require.resolve('./' + val));
    var unit = require('./' + val);
    log.info(JSON.stringify(unit));
    testCase(unit);
}

function testCase(unit) {
    var unitFunc = require('../models/handlers/' + unit['moduleName']);
    var result = [];
    for (var key in unit) {
        if (key == 'moduleName') {
            continue;
        }
        log.info(key);
        doTestCase(unit, key, unitFunc);
    }
}

function doTestCase(unit, key, unitFunc) { 
    var result = [];
    unitFunc(
        unit[key]['args']['reqInfo'],
        unit[key]['args']['reqDetail'],
        result,
        unit[key]['args']['basePath'],
        function() {
            validateCase(key, unit[key]['expectResult'], result);
        }
    );
}

function validateCase(key, expectResult, result) {
    log.info('int test ' + key);
    log.info('Expect result Number is: ' + expectResult.length);
    log.info('Expect result is: ' + JSON.stringify(expectResult));
    log.info('Result Number is: ' + result.length);
    log.info('Result is: ' + JSON.stringify(result));
    if (result.length != sortExpectResult.length) {
        log.error('The length mismutch');
        return;
    }
    var sortResult = result.sort();
    var sortExpectResult = expectResult.sort();
    for (var i = 0; i < sortResult.length; i++) {
        if (sortResult[i].length != sortExpectResult[i].length) {
            log.error('Mismatch');
            return;
        }
        for (var j = 0; j < sortResult[i].length; j++) {
            if (sortResult[i][j] != sortExpectResult[i][j]) {
                log.error('Mismatch');
                return;
            }
        }
    }
}

beginTest();
