angular.module('bushopper.services', [])

    .factory('StopService', function() {

        var stop = {
            num: '',
            routes: []
        };

        return {
            getStop: function() { return stop.num; },
            setStop: function(n) { stop.num = n; },
            insertRouteInfo: function(busNum, busDesc) { stop.routes.push(new RouteInfo(busNum, busDesc)) },
            setRouteInfo: function(routes) { stop.routes = routes },
            getRouteInfo: function() { return stop.routes },
            clearRouteInfo: function() { stop.routes = [] }
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
                    var buses = [];

                    for (var x = 0; x < routes.length; x++) {
                        buses.push(
                            new RouteInfo(
                                routes[x].childNodes[0].innerHTML,
                                routes[x].childNodes[3].innerHTML
                            )
                        );
                    }
                    return buses;
                }
        }
    })

    .factory('Navigation', function($state) {
        return {
            goDashboard : function() {
                $state.go('dash');
            },
            goSelectRoute : function() {
                $state.go('selectbus');
            },
            goResults : function() {
                $state.go('result');
            }
        }
    })

    .factory('Alert', function($ionicPopup, $ionicLoading) {
        return {
            displayError: function(title, msg, cb) {
                $ionicPopup.alert({
                    title: title,
                    template: msg,
                    okType: 'button-assertive'
                }).then(cb);
            },
            displayLoading: function() {
                $ionicLoading.show({ templateUrl: 'templates/misc/loading.html'});
            },
            hideLoading: function() {
                $ionicLoading.hide();
            }
        }
    })
;
