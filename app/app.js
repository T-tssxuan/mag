var express = require('express');

var delayChecker = require('./models/delay-checker');
var Handler = require('./models/handler.js');

var log4js = require('log4js');

var log = log4js.getLogger('app');

var app = express();

// start the delay checker
delayChecker.start();

app.get('/', function (req, res) {
    console.log('id1: ' + req.query.id1);
    console.log('id2: ' + req.query.id2);
    var beginTime = Date.now();
    var preResSend = res.send;
    res.send = function(data) {
        res.send = preResSend;
        res.send(data);
        var elaps = Date.now() - beginTime;
        log.info('request finished in ' + elaps + 'ms');
    }
    var h = new Handler(delayChecker.getDelay(),
                        req.query.id1,
                        req.query.id2,
                        res);
    h.start();
});

app.listen(3000);
