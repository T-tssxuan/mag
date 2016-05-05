var log4js = require("log4js");
var log = log4js.getLogger('magUrlMake');

var baseUrl = "https://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";

/**
 * Make a the mag api requst url according to given parameters.
 *
 * @param {String} expr no empty
 * @param {Number} count default 1
 * @param {String} attributes default ''
 *
 * @return {String} the constructed url or empty string on error
 */
module.exports = function(expr, attributes, count) {
    if (!expr) {
        log.error("expr or attributes not set");
        return '';
    } else {
        var _attributes = attributes || '';
        var _count = count || 1;
        var url = baseUrl;
        url += 'expr=' + expr + '&';
        url += 'count=' + _count + '&';
        url += 'attributes=' + _attributes;
        url += magKey;
        log.info("url: " + url);
        return url;
    }
}
