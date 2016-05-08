var log4js = require('log4js');
var log = log4js.getLogger('cache');

function Cache(urlSize, resultSize) {
    this._urlSize = urlSize || 1000;
    this.urlIndex = new Array(this._urlSize);
    this.urlCache = {};
    this.urlPos = 0;

    this._resultSize = resultSize || 1000;
    this.resultIndex = new Array(this._resultSize);
    this.resultCache = {};
    this.resultPos = 0;
}

Cache.prototype.insertUrl = function(url, data) {
    if (this.urlIndex[this.urlPos]) {
        delete this.urlCache[this.urlIndex[this.urlPos]];
    }
    log.info('insert url: ' + url);
    this.urlIndex[this.urlPos] = url;
    this.urlCache[url] = data;
    this.urlPos = (this.urlPos + 1) % 1000;
}

Cache.prototype.insertResult = function(id1, id2, data) {
    if (this.resultIndex[this.resultPos]) {
        delete this.resultCache[this.resultIndex[this.resultPos]];
    }
    log.info('insert result: ' + id1 + ' ' + id2);
    this.resultIndex[this.resultPos] = id1 + ' ' + id2;
    this.resultCache[id1 + ' ' + id2] = data;
    this.resultPos = (this.resultPos + 1) % 1000;
}

Cache.prototype.getUrl = function(url) {
    log.info('get url: ' + url);
    if (this.urlIndex.indexOf(url) != -1) {
        log.debug('data get');
        return this.urlCache[url];
    } else {
        return null;
    }
}

Cache.prototype.getResult = function(id1, id2) {
    log.info('get result: ' + id1 + ' ' + id2);
    if (this.resultIndex.indexOf(id1 + ' ' + id2) != -1) {
        log.debug('data get: ' + this.resultCache[id1 + ' ' + id2]);
        return this.resultCache[id1 + ' ' + id2];
    } else {
        return null;
    }
}

module.exports = Cache;
