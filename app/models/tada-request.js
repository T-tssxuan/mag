var log4js = require('log4js');
var request = require('request');

var log = log4js.getLogger('tadaRequest');

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
    var tryTime = maxTry || 4;
    log.warn('info: ' + JSON.stringify(info));
    request.get(url, {timeout: info.timeout}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            log.info(response.statusCode + '');
            // if successed parse the data and invoke the callback function
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
            console.log(JSON.stringify(data));
            callback(err, data);
        } else {
            // if failed retry
            info.timeoutCount++;
            if (info.flag && tryTime > 1) {
                tadaRequest(url, info, callback, --tryTime);
                log.debug('failed retry: ' + 
                          tryTime + ' url: ' + url);
            } else {
                log.error('failed no retry ' + ' url: ' + url);
                callback('failed', data);
            }
        }

        // Calculate the timeout according to recently statistic
        var sum = info.receivedCount + info.timeoutCount;
        log.warn("sum: " + sum);
        if (sum > 15) {
            if (info.receivedCount / sum <= 0.2) {
                info.receivedCount = 0;
                info.timeoutCount = 0;
                info.timeout -= info.timeout / 20;
                info.timeout = info.timeout > 200? info.timeout : 200;
            } else if (info.timeoutCount / sum >= 0.8) {
                info.receivedCount = 0;
                info.timeoutCount = 0;
                info.timeout += info.timeout / 20;
            }
        }
    });
}

module.exports = tadaRequest;
