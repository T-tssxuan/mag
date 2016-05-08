var express = require('express');

var delayChecker = require('./models/delay-checker');
var Handler = require('./models/handler.js');
var Cache = require('./models/cache.js');

var log4js = require('log4js');

var log = log4js.getLogger('app');

var cache = new Cache(500, 500);

var app = express();

// start the delay checker
delayChecker.start();

app.get('/', function (req, res) {
    log.info('new requet id1: ' + req.query.id1 + ' id2: ' + req.query.id2);
    var beginTime = Date.now();
    var preResSend = res.send;
    var maybeResult = cache.getResult(req.query.id1, req.query.id2);
    if (maybeResult) {
        res.send(maybeResult);
    } else {
        res.send = function(data) {
            res.send = preResSend;
            var elapse = Date.now() - beginTime;
            res.send(data);
            cache.insertResult(req.query.id1, req.query.id2, data);
            log.info('request finished in ' + elapse + 'ms');
        }
        var h = new Handler(delayChecker.getDelay(),
                            req.query.id1,
                            req.query.id2,
                            res,
                            cache
                           );
        h.start();
    }
});

app.listen(3000);
