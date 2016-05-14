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
    if (typeof info.urlCache.getUrl(url) != 'undefined') {
        log.info('cache hit url: ' + url);
        return callback(null, info.urlCache.getUrl(url));
    }

    var tryTime = maxTry || 1000;
    log.info('processing: ' + processing + ' MAXRequest: ' + MAXRequest + 
             ' queue len: ' + queue.length);

    if (processing >= MAXRequest) {
        queue.push([url, info, callback, maxTry, wait]);
        return;
    }
    processing++;

    var timeout = info.timeout;
    var beginTime = Date.now();
    request.get(url, {timeout: timeout}, function (error, response, body) {
        processing--;
        var elapse = Date.now() - beginTime;
        log.info('request time: ' + elapse + 'ms');
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
                info.urlCache.insertUrl(url, data);
            } catch(e) {
                err = e;
            }
            info.timeout = elapse * 1.5;
            log.debug('url: ' + url)
            // console.log(JSON.stringify(data));
            callback(err, data);
        } else {
            log.warn('info timeout: ' + info.timeout);
            log.error('retry: ' + tryTime + ' ' + url);
            info.timeout = elapse * 2;
            // if failed retry
            if (info.flag && tryTime > 1) {
                tadaRequest(url, info, callback, --tryTime, wait);
            } else {
                log.error('failed no retry ' + ' url: ' + url);
                callback('failed', data);
            }
        }
    });
}

module.exports = tadaRequest;
