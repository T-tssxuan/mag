var request = require('request');
var cidSet = [
    1171345118, 1183230087, 1164762582, 1194992345, 1194992345,
    1161424158, 1171178643, 1143723981, 1133523790, 1175089206,
    1164975091, 1123349196, 1130985203, 1135342153, 1123349196
];
var jidSet = [
    168680287, 35412551, 141585851, 9314624, 104833954,
    175543413, 206455561, 173952182, 173339282, 82088436,
    90791864, 116100596, 45012897, 133490392, 31010182
];
var fidSet = [
    78168278, 135572916, 41008148, 500300565, 135572916,
    197055811, 739882, 119857082, 115225779, 63490418,
    155332784, 177818476, 192028432, 84525736, 48702757
];

var auidSet = [
    2134045017, 2121939561, 2175015405, 2273653009, 688151781,
    270568614, 2026348770, 528001700, 2166344056, 2128240947,
    2042368608, 86077944, 2137250397, 2087263615, 1817681102
];
var afidSet = [
    98251732, 70978881, 1334627681, 74775410, 916559398,
    916559398, 114531698, 72253084, 43545212, 54863784,
    1321274317, 54863784, 206949727, 95457486, 136199984
];
var idSet = [
    1981398125, 2113146968, 2163993204, 2057351095, 2057351095,
    2083923088, 1991692264, 2151478249, 2056752681, 2069277484, 
    2118492507, 2136334331, 2072923279, 1983208835, 2121772044
];

var test.cidSet:{
    url: [
        '
    ],
    run: function() {
    }
};
test.jidSet = {
    url: [
    ],
    run: function() {
    }
};
test.fidSet: {
    url: [
    ],
    run: function() {
    }
};
test.auidSet: {
    url: [
        ['Composite(AA.AuId=auid)', 'Id', 10000]
        ['Composite(AA.AuId=auid)', '', 1]
    ],
    run: function() {
    }
};

test.afidSet: {
    url: [
    ],
    run: function() {
    }
};
test.idSet: {
    url: [
        'expr=Id=id&attributeId,RId,AA.AuId,J.JId,C.CId,F.FId&count=10000',
        'expr
    ],
    run: function() {
    }
};