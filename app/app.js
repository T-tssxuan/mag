var express = require('express');

var delayChecker = require('./models/delay-checker');
var Handler = require('./models/handler.js');

var log4js = require('log4js');

var log = log4js.getLogger('app');

var app = express();

// start the delay checker
delayChecker.start();

app.get('/', function (req, res) {
    log.info('new requet id1: ' + req.query.id1 + ' id2: ' + req.query.id2);
    var beginTime = Date.now();
    var preResSend = res.send;
    res.send = function(data) {
        res.send = preResSend;
        var elapse = Date.now() - beginTime;
        res.send(data);
        log.info('request finished in ' + elapse + 'ms');
    }
    var h = new Handler(delayChecker.getDelay(),
                        req.query.id1,
                        req.query.id2,
                        res);
    h.start();
});

app.listen(3000);
