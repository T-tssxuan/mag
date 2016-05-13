function Cache(urlSize, interval) {
    this.urlSize = urlSize || 10000;
    this.urlIndex = new Array(this.urlSize);
    this.urlPos = 0;
    this.urlCache = {};
    this.interval = interval || 10000;
}

Cache.prototype.resetClearData = function() {
    clearTimeout(this.timer);
    this.timer = setTimeout(function(that) {
        console.log('clear data');
        that.urlIndex = new Array(this.urlSize);
        that.urlCache = {};
        that.urlPos = 0;
    }, this.interval, this);
}

Cache.prototype.insertUrl = function(url, data) {
    if (this.urlIndex[this.urlPos] 
        && typeof this.urlCache[this.urlIndex[this.urlPos]] != 'undefined') {
        delete this.urlCache[this.urlIndex[this.urlPos]];
    }
    this.urlIndex[this.urlPos] = url;
    this.urlCache[url] = data;
    this.urlPos = (this.urlPos + 1) % this.urlSize;
    this.resetClearData();
}

Cache.prototype.getUrl = function(url) {
    return this.urlCache[url];
}

module.exports = Cache;
