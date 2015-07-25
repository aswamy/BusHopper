function RouteInfo(num, desc, stop) {
    this.num = num;
    this.desc = desc;
    this.stop = stop;

    this.getRouteNum = function() { return this.num };
    this.getRouteDesc = function() { return this.desc };
    this.getRouteStop = function() { return this.stop };

    this.equals = function(r) {
        if (this.num == r.num && this.desc == r.desc && this.stop == r.stop)
            return true;
        return false;
    };
}

RouteInfo.prototype.toString = function toString() {
    return this.num;
};