var request = require('request');
var log4js = require('log4js');
var mapUrlMake = require('./mag-url-make');
var log = log4js.getLogger('prerequest');
var async = require('async');

function makeUrls(id1, id2) {
    // generate urls for split RId request 
    var genUrls = [];

    // for 3-hop (Id, AA.AuId)->Id->Id->Id
    for (var i = 0; i < 20; i++) {
        var tmp = mapUrlMake('RId=' + id2, 'Id', 10000, i * 10000);
        var obj = {};
        obj['base'] = tmp;
        obj['mapUrl'] = [tmp];
        genUrls.push(obj);
    }
    var literalUrls = [
        // for auid1
        {
            'base': mapUrlMake(
                'Composite(AA.AuId=' + id1 + ')', 
                'Id,AA.AuId,AA.AfId',
                10000),
            'mapUrl': [
                // for 1-hop AA.AuId field
                mapUrlMake(
                    'Composite(AA.AuId=' + id1 + ')', 
                    'Id,AA.AuId,AA.AfId', 
                    10000
                )
            ]
        },
        // for auid2
        {
            'base': mapUrlMake(
                'Composite(AA.AuId=' + id2 + ')',
                'Id,AA.AuId,AA.AfId',
                10000
            ),
            'mapUrl': [
                // for 3-hop (Id,AA.AuId)->Id->Id->AA.AuId
                mapUrlMake(
                    'Composite(AA.AuId=' + id2 + ')',
                    'Id',
                    10000
                ),
                // for 3-hop AA.AuId2->AA.AfId
                mapUrlMake(
                    'Composite(AA.AuId=' + id2 + ')',
                    'AA.AuId,AA.AfId',
                    1000
                ),
                // for 2-hop AA.AfId->AA.AuId
                mapUrlMake(
                    'Composite(AA.AuId=' + id2 + ')',
                    'AA.AuId,AA.AfId',
                    1000
                ), 
            ]
        },
        // for id1
        {
            'base': mapUrlMake('Id=' + id1, 'RId,F.FId,C.CId,AA.AuId,J.JId'),
            'mapUrl': [
                // for 1-hop Id field
                mapUrlMake('Id=' + id1, 'RId,F.FId,C.CId,AA.AuId,J.JId'),
            ]
        },
        // for id2
        {
            'base': mapUrlMake('Id=' + id2, 'AA.AuId,J.JId,C.CId,F.FId'),
            'mapUrl': [
                // luoxuan
                // for 3-hop (Id, AA.AuId)->Id->(AA.AuId,J.JId,C.CId,F.FId)->Id
                mapUrlMake('Id=' + id2, 'AA.AuId,J.JId,C.CId,F.FId'),

                // weilai
                // for Id2->AA.AuId
                mapUrlMake('Id=' + id2, 'AA.AuId', 1000),

                // bian
                // for C.CId->Id
                mapUrlMake('Id=' + id2, 'C.CId', 1),
                // for F.FId->Id
                mapUrlMake('Id=' + id2, 'F.FId', 100),
            ],
        }
    ];

    return genUrls.concat(literalUrls);
}

module.exports = function(id1, id2, cache) {
    var urls = makeUrls(id1, id2);
    async.each(urls, function(item, callback) {
        request.get(item['base'], function(err, response, body) {
            if (!err && response.statusCode == 200) {
                log.debug('get base url: ' + item['base'] + ' success!');
                var data;
                try {
                    data = JSON.parse(body);
                    data = data['entities'];
                } catch(e) {
                    return;
                }
                for (var i = 0; i < item['mapUrl'].length; i++) {
                    cache[item['mapUrl'][i]] = data;
                }
            }
            callback(null);
        });
    }, function(err) {
        return;
    });
}
