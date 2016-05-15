var request = require('request');
var log4js = require('log4js');
var log = log4js.getLogger('delayChecker');

var delayChecker = {
    // interval handler
    intervalHandler: 0, 

    // default interval to check the delay
    checkInterval: 10000, 

    // the request auto timeout
    timeout: 100000, 

    // the test url
    url: 'http://oxfordhk.azure-api.net/academic/v1.0/evaluate?expr=Id=2140251882&count=10000&attributes=Id,AA.AuId,AA.AfId&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6',
    pos: 0,
    values: [200, 200, 200, 200, 200]
}

/**
 * Start the delay checker, the delaychecker send request to the given url and
 * calculate the delay.
 * The checker will start with given interval to get the latest delay.
 */
delayChecker.start = function() {
    var that = this;

    var callback = function() {
        var begin = Date.now();
        request.get(that.url, {timeout: that.timeout}, function(err, res) {
            var elapse = Date.now() - begin;
            that.values[that.pos] = elapse;
            that.pos = (that.pos + 1) % that.values.length;
            log.debug("Current delay: " + elapse);
        });
    }

    callback();

    that.intervalHandler = setInterval(callback, that.checkInterval);
}

/**
 * stop the dela
 */
delayChecker.stop = function() {
    clearInterval(this.intervalHandler);
}

/**
 * Get the lastest delay.
 *
 * @return {Number}
 */
delayChecker.getDelay = function() {
    var tmp = this.values.reduce(function(pre, cur) {
        return pre + cur;
    }, 0) / this.values.length;
    return tmp;
}

module.exports = {
    'start': function() {
        log.info("start delay checker");
        delayChecker.start();
    },
    'stop': function() {
        log.info("stop delay checker");
        delayChecker.stop();
    },
    'getDelay': function() {
        return delayChecker.getDelay();
    }
}
