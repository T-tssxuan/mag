var log4js = require('log4js');
var request = require('request');

var log = log4js.getLogger('tadaRequest');

var MAXRequest= 150;
var queue = [];
var processing = 0;

/**
 * An encapsulated request function, which provoide the timeout adjust and 
 * response data preprocess.
 *
 * @param {String} url
 * @param {Object} info
 * @param {Function} callback
 * @param {Integer} maxTry Optional
 */
var tadaRequest = function (url, info, callback, maxTry, wait) {
    if (info.urlCache[url]) {
        log.info('cache hit url: ' + url);
        return callback(null, info.urlCache[url]);
    }
    var tryTime = maxTry || 10000;
    log.info('processing: ' + processing + ' MAXRequest: ' + MAXRequest + 
             ' queue len: ' + queue.length);
    if (processing >= MAXRequest) {
        queue.push([url, info, callback, maxTry, wait]);
        return;
    }
    var timeout = info.timeout;
    if (wait) {
        log.warn('url: ' + url)
        log.warn('wait: ' + wait);
        timeout += 500;
    }
    processing++;
    var beginTime = Date.now();
    request.get(url, function (error, response, body) {
        processing--;
        if (!error && response.statusCode == 200) {
            // if successed parse the data and invoke the callback function
            if (queue.length > 0) {
                var tmp = queue.shift();
                tadaRequest(tmp[0], tmp[1], tmp[2], tmp[3], tmp[4]);
            }
            info.receivedCount++;
            var err = null;
            var data;
            try {
                data = JSON.parse(body);
                data = data['entities'];
            } catch(e) {
                err = e;
            }
            log.info('request time: ' + (Date.now() - beginTime) + 'ms');
            log.debug('url: ' + url)
            // console.log(JSON.stringify(data));
            callback(err, data);
        } else {
            log.warn('info timeout: ' + info.timeout);
            // log.debug('retry: ' + tryTime + ' ' + url);
            // if failed retry
            info.timeoutCount++;
            if (info.flag && tryTime > 1) {
                tadaRequest(url, info, callback, --tryTime, wait);
            } else {
                log.error('failed no retry ' + ' url: ' + url);
                callback('failed', data);
            }
        }

        // Calculate the timeout according to recently statistic
        var sum = info.receivedCount + info.timeoutCount;
        if (sum > 5) {
            if (info.timeoutCount / sum <= 0.5) {
                info.timeout -= info.timeout / 10;
                info.timeout = info.timeout > 500? info.timeout : 500;
            } else if (info.timeoutCount / sum >= 0.6) {
                info.timeout += info.timeout / 10;
                info.timeout = info.timeout < 5000? info.timeout : 5000;
            }
            info.receivedCount = 0;
            info.timeoutCount = 0;
        }
    });
}

module.exports = tadaRequest;
