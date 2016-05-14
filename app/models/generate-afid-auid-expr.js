var baseUrl = "http://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";
var SPACE = 2048 - baseUrl.length - magKey.length - 100;


/**
 * Generate the MAG Or expr for AfIds and AuIds
 *
 * @param {Array} AuIds the AuId list
 * @param {Array} AfIds the AfId list
 *
 * @return {Array} all or expr for And(AuId,AfId)
 */
module.exports = function(AuIds, AfIds) {
    var results = [];
    var expr = ''; 
    for (var i = 0; i < AuIds.length; i++) {
        for (var j = 0; j < AfIds.length; j++) {
            if (i == 0 && j == 0) {
                expr = 'Composite(And(AA.AfId=' + AfIds[j] + ',AA.AuId=' + AuIds[i] + '))';
            } else {
                if (expr.length + 55 < SPACE) {
                    expr = 'Or(' + expr + ',';
                    expr += 'Composite(And(AA.AfId=' + AfIds[j] + ',AA.AuId=' + AuIds[i] + ')))';
                } else {
                    results.push(expr);
                    expr = 'Composite(And(AA.AfId=' + AfIds[j] + ',AA.AuId=' + AuIds[i] + '))';
                }
            }
        }       
    }
    if (expr != '') {
        results.push(expr);
    }
    return results;
}
