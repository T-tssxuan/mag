var noCompositeField = ['Id', 'RId'];
var baseUrl = "http://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";
var SPACE = 2048 - baseUrl.length - magKey.length - 100;


/**
 * Generate the MAG Or expr for given array
 * 注：本函数已经考虑除expr之外的所有内容的预留空间，所以在使用reserveSpace时
 * 只需提供expr中的其它部分的长度就行了。
 *
 * @param {String} field value can be: AA.AuId, C.CId, F.FId, J.JId, Id, RId ...
 * @param {Array} basePath the base path
 * @param {Number} reserveSpace the space reserved for other expr elements
 *
 * @return {Array} all Or expr for the basePath elements
 */
module.exports = function(field, basePath, reserveSpace) {
    var results = [];
    var maxLen = SPACE - reserveSpace;
    var expr = '';
    if (noCompositeField.indexOf(field) == -1) {
        // Calculate the Composite style Or expr
        expr = 'Composite(' + field + '=' + basePath[0] + ')';
        for (var i = 1; i < basePath.length; i++) {
            if (expr.length + 50 < maxLen) {
                expr = 'Or(' + expr + ',';
                expr += 'Composite(' + field + '=' + basePath[i] + '))';
            } else {
                results.push(expr);
                expr = 'Composite(' + field + '=' + basePath[i] + ')';
            }
        }
    } else {
        // Calculate other style Or expr
        expr = field + '=' + basePath[0];
        for (var i = 1; i < basePath.length; i++) {
            if (expr.length + 40 < maxLen) {
                expr = 'Or(' + expr + ',';
                expr += field + '=' + basePath[i] + ')';
            } else {
                results.push(expr);
                expr = field + '=' + basePath[i];
            }
        }
    }
    results.push(expr);
    return results;
}
