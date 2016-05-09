var log4js = require('log4js');
var request = require('request');

var log = log4js.getLogger('tadaRequest');

var MAXRequest= 100;
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
var tadaRequest = function (url, info, callback, maxTry) {
    var tryTime = maxTry || maxTry < 10000 || 10000;
    // log.info('processing: ' + processing + ' MAXRequest: ' + MAXRequest + 
    //          ' queue len: ' + queue.length);
    if (processing >= MAXRequest) {
        queue.push([url, info, callback, maxTry]);
        return;
    }
    processing++;
    request.get(url, {timeout: info.timeout}, function (error, response, body) {
        processing--;
        if (!error && response.statusCode == 200) {
            // if successed parse the data and invoke the callback function
            if (queue.length > 0) {
                var tmp = queue.shift();
                tadaRequest(tmp[0], tmp[1], tmp[2], tmp[3]);
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
            log.debug('url: ' + url)
            // console.log(JSON.stringify(data));
            callback(err, data);
        } else {
            log.warn('info timeout: ' + info.timeout);
            log.debug('retry: ' + tryTime + url);
            // if failed retry
            info.timeoutCount++;
            if (info.flag && tryTime > 1) {
                tadaRequest(url, info, callback, --tryTime);
            } else {
                log.error('failed no retry ' + ' url: ' + url);
                callback('failed', data);
            }
        }

        // Calculate the timeout according to recently statistic
        var sum = info.receivedCount + info.timeoutCount;
        if (sum > 5) {
            if (info.timeoutCount / sum <= 0.5) {
                info.timeout -= info.timeout / 20;
                info.timeout = info.timeout > 200? info.timeout : 200;
            } else if (info.timeoutCount / sum >= 0.6) {
                info.timeout += info.timeout / 20;
                info.timeout = info.timeout < 3000? info.timeout : 3000;
            }
            info.receivedCount = 0;
            info.timeoutCount = 0;
        }
    });
}

module.exports = tadaRequest;
