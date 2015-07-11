angular.module('bushopper.services', [])

    .factory('StopService', function() {

        var data = {
            num: ''
        };

        return {
            get: function() { return data.num },
            set: function(n) { data.num = n }
        };
    })

    .factory('OC', function($http) {

        var parser = new DOMParser();

        // Poor excuse of security to avoid pasting oc transpo api key on github
        // Remember kids, obscurity is not security :(
        var ocKey = (typeof _oc == "undefined") ? {} : _oc;
        var ocParams = [];

        for (var x in ocKey)
            ocParams.push(x + "=" + ocKey[x]);

        return {
            getStopInfo :
                function(stopNum) {
                    return $http.post('/api/GetRouteSummaryForStop', ocParams.join("&") + "&stopNo=" + stopNum);
                },
            getBusInfo :
                function(stopNum, busNum) {
                    return $http.post('/api/GetNextTripsForStop', ocParams.join("&") + "&stopNo=" + stopNum + "&routeNo=" + busNum);
                },
            getAllBusInfo :
                function(stopNum) {
                    return $http.post('/api/GetNextTripsForStopAllRoutes', ocParams.join("&") + "&stopNo=" + stopNum);
                },
            parseStopInfo :
                function(stopInfo) {
                    var xml = parser.parseFromString(stopInfo, "text/xml");
                    var routes = xml.getElementsByTagName("Route");
                    var busses = [];

                    for (var x = 0; x < routes.length; x++) {
                        busses.push({
                            num: routes[x].childNodes[0].innerHTML,
                            desc : routes[x].childNodes[3].innerHTML
                        });
                    }
                    return busses;
                }
        }
    })
;
