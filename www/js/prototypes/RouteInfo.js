function RouteInfo(num, desc) {
    this.num = num;
    this.desc = desc;

    this.getRouteNum = function() { return this.num };
    this.getRouteDesc = function() { return this.desc };
}