function Cache() {
    this.urlCache = {};
    this.resultCache = {};
}

Cache.prototype.insertUrl = function(url, data) {
    this.urlCache[url] = data;
}

Cache.prototype.insertResult = function(id1, id2, data) {
    this.resultCache[id1 + ' ' + id2] = data;
}

Cache.prototype.getUrl = function(url) {
    return this.urlCache[url];
}

Cache.prototype.getResult = function(id1, id2) {
    return this.resultCache[id1 + ' ' + id2];
}

module.exports = Cache;
