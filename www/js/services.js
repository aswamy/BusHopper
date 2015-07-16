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
                    var buses = [];
                    var stopRoutes = $($.parseXML(stopInfo)).find("Route");

                    for (var x = 0; x < stopRoutes.length; x++) {
                        buses.push(
                            new RouteInfo(
                                $(stopRoutes[x]).find("RouteNo").text(),
                                $(stopRoutes[x]).find("RouteHeading").text()
                            )
                        );
                    }
                    return buses;
                },
            parseBusInfo :
                function(busInfo, selectedRoute) {
                    var xml = parser.parseFromString(busInfo, "text/xml");
                    var routes = xml.getElementsByTagName("RouteDirection");
                    var stopRoutes = $($.parseXML(busInfo)).find("RouteDirection");

                    for (var x = 0; x < stopRoutes.length; x++) {
                        if($(stopRoutes[x]).find("RouteLabel").text() == selectedRoute.getRouteDesc()) {
                            var availableTrips = $(stopRoutes[x]).find("Trip");
                            var trips = [];

                            for (var y = 0; y < availableTrips.length; y++) {
                                trips.push(
                                    new TripInfo(
                                        selectedRoute.getRouteNum(),
                                        $(availableTrips[y]).find("TripDestination").text(),
                                        $(availableTrips[y]).find("AdjustedScheduleTime").text(),
                                        $(availableTrips[y]).find("BusType").text(),
                                        $(availableTrips[y]).find("GPSSpeed").text().length > 0
                                    )
                                );
                            }
                            return trips;
                        }
                    }
                    return [];
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
            displayOCError: function(cb) {
                this.displayError("Cannot connect to OCTranspo Server", "Check your internet connection. If you are connected, OCTranspo API might be down.", cb);
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
