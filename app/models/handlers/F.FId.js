var log4js = require('log4js');
var async = require('async');
var tadaRequest = require('../tada-request');
var magUrlMake = require('../mag-url-make');

var log = log4js.getLogger('Id-RId');

// Using this object to check whether this path app suitable to the query pair
var adatper = {
    'Id': ['AA.AuId', 'Id'],
    'AA.AuId': []
}

/**
 * Search the path with given basePath
 *
 * @param {Object} reqInfo the infomation about the request
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Array} basePath the base path of the request
 * @param {Function} cbFunc the callback function
 */
function searchPath(reqInfo, reqDetail, result, basePath, cbFunc) {
    async.parallel([
        function(callback){
            //F.FId->Id
            var error = null;
            if(reqDetail.desc[1]=="Id")
            {
                //request param
                var expr = "Id="+reqDetail.value[1];
                var attributes = "F.FId";
                var count = 100;
                //make url
                var url = module.exports(expr, attributes, count);
                //send request
                if(url != null){
                    tadaRequest(url, reqInfo, function(err, data) {
                        handle_2_hop_result(err, data, basePath, result, reqDetail);
                    });
                }
                else{
                    error="get URL error: url is null!";
                }
            }
            //if not, exit immediately
            callback(error);
        },
        function(callback) {
            // F.FId->Id->AA.AuId

            callback(null);
        },
        function(callback) {
            // F.FId->Id->Id

            callback(null);
        }
    ], function(err) {
        cbFunc(err);
    });
}

/**
 * Search the path with given basePath
 *
 * @param {Object} reqInfo the infomation about the request
 * @param {Object} reqDetail the infomation about the query pair
 * @param {Array} basePath the base path of the request
 * @param {Function} cbFunc the callback function
 */
module.exports = function(reqInfo, reqDetail, result, basePath, cbFunc) {
    // Before search path check whether this module suitable for query pair
    if (adatper[reqDetail.desc[0]].indexOf(reqDetail.desc[1]) == -1) {
        cbFunc();
    } else {
        searchPath(reqInfo, reqDetail, result, basePath, cbFunc);
    }
}

/**
 * get 2-hop result by response data and basePath
 *
 * @param {Object} err infomation
 * @param {Object} response data
 * @param {Array} basePath the base path of the request
 * @param {Array} final result set
 * @param {Object} reqDetail the infomation about the query pair
 */
function handle_2_hop_result(err, data, basePath, result, reqDetail) {
    var FidsArray = data[0].F;//this array only has one element, get its "F" array
    var FidsStringArray = new Array();//resultId's F.FId
    
    for(var i=0;i<FidsArray.length;i++){
        FidsStringArray[i]=FidsArray[i].FId;
    }

    var hashTable = new Object();//find intersection of startFid and endFid
    for(var i = 0; i<basePath.length;i++){
        //console.log(basePath[i]);
        hashTable[key] = 1;
    }
    for(var i = 0;i<FidsStringArray.length;i++){
        //console.log(FidsStringArray[i]);
        if(FidsStringArray[i] in hashTable){
            //2-hop result
            var path = {[reqDetail.value[0], FidsStringArray[i], reqDetail.value[1]]};
            log.debug("found 2-hop result:"+path);
        }
        hashTable[key] = 1;
    }
}
