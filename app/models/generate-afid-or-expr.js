module.exports = function(AuIds, AfId)
{
    var baseUrl = "http://oxfordhk.azure-api.net/academic/v1.0/evaluate?";
    var magKey = "&subscription-key=f7cc29509a8443c5b3a5e56b0e38b5a6";
    var SPACE = 2048 - baseUrl.length - magKey.length - 100;
    var result = [];

    var expr = 'Composite(And(AA.AfId='+AfId+',AA.AuId='+AuIds[0]+'))';
    for (var i = 1; i < AuIds.length; i++) {
        if (expr.length + 50 < SPACE) {
            expr = 'Or(' + expr + ',';
            expr += 'Composite(And(AA.AfId=' + AfId + ',AA.AuId=' + AuIds[i] + ')))';
        } else {
            results.push(expr);
            expr += 'Composite(And(AA.AfId=' + AfId + ',AA.AuId=' + AuIds[i] + '))';
        }
    }
    result.push(expr);
    return result;
}