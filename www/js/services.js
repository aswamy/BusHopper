angular.module('bushopper.services', [])

    .factory('StopService', function() {

        var stop = {
            num: '',
            selectedRoutes: [], // 1D array of RouteInfo
            recentRoutes: [],   // 2D array of RouteInfo (atm its only 1D array)
            favoriteRouteSets: []  // 2D array of RouteInfo
        };

        function isRouteSetEqual(rs1, rs2) {
            if (rs1 == undefined || rs2 == undefined)
                return false;

            if (rs1.length == rs2.length) {
                for (var i = 0; i < rs1.length; i++) {
                    var foundElement = false;
                    for (var j = 0; j < rs2.length; j++) {
                        if (rs1[i].equals(rs2[j])) {
                            foundElement = true;
                        }
                    }
                    if(!foundElement)
                        return false;
                }
                return true;
            }
            return false;
        }

        return {
            getStop: function() { return stop.num; },
            setStop: function(n) { stop.num = n; },

            insertRouteInfo: function(rInfo) { stop.selectedRoutes.push(rInfo) },
            setRouteInfo: function(routes) { stop.selectedRoutes = routes },
            getRouteInfo: function() { return stop.selectedRoutes },
            clearRouteInfo: function() { stop.selectedRoutes = [] },

            getRecentRoutes: function() { return stop.recentRoutes },
            addRecentRoutes: function(r) {
                stop.recentRoutes.push(r);
                while (stop.recentRoutes.length > 5) {
                    stop.recentRoutes.shift();
                }
            },

            isRouteSetFavorited: function(rs) {
                for (var i = 0; i < stop.favoriteRouteSets.length; i++) {
                    if(isRouteSetEqual(rs, stop.favoriteRouteSets[i]))
                        return true;
                }
                return false;
            },
            addFavoriteRouteSet: function(rs) {
                stop.favoriteRouteSets.push(rs);
            },
            removeFavoriteRouteSet: function(rs) {
                for (var i = 0; i < stop.favoriteRouteSets.length; i++) {
                    if(isRouteSetEqual(rs, stop.favoriteRouteSets[i])) {
                        stop.favoriteRouteSets.splice(i, 1);
                        break;
                    }
                }
            },
            getAllFavoriteRouteSets: function() { return stop.favoriteRouteSets; },


            getAllFavoriteRoutes: function() { return stop.favoriteRouteSets },
            getFavoriteRoute: function(stopNum, busNum, busDesc) {
                var rt;
                for (var x = 0; x < stop.favoriteRouteSets; x++) {
                    rt = stop.favoriteRouteSets[x];
                    if( rt.num == busNum &&
                        rt.desc == busDesc &&
                        rt.stop == stopNum) {
                        return rt;
                    }
                }
                return null;
            },
            addFavoriteRoute: function(stopNum, busNum, busDesc) {
                var rt = new RouteInfo(busNum, busDesc, stopNum);
                stop.favoriteRouteSets.push(rt);
                return rt;
            },
            removeFavoriteRoute: function(rt) {
                for (var x = 0; x < stop.favoriteRouteSets; x++) {
                    if(rt == stop.favoriteRouteSets[x]) {
                        stop.favoriteRouteSets.splice(x, 1);
                    }
                }
            }
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
                    var requestUrl = '/api/GetRouteSummaryForStop';
                    var requestParams = ocParams.join("&") + "&stopNo=" + stopNum;
                    console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
                },
            getBusInfo :
                function(stopNum, busNum) {
                    var requestUrl = '/api/GetNextTripsForStop';
                    var requestParams = ocParams.join("&") + "&stopNo=" + stopNum + "&routeNo=" + busNum;
                    console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
                },
            getAllBusInfo :
                function(stopNum) {
                    var requestUrl = '/api/GetNextTripsForStopAllRoutes';
                    var requestParams = ocParams.join("&") + "&stopNo=" + stopNum;
                    console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
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
                    var stopRoutes = $($.parseXML(busInfo)).find("RouteDirection");

                    if(stopRoutes.length == 0) {
                        console.log('no routes in stop');
                        console.log(busInfo);
                    }

                    for (var x = 0; x < stopRoutes.length; x++) {
                        if($(stopRoutes[x]).find("RouteLabel").text() == selectedRoute.getRouteDesc()) {
                            var availableTrips = $(stopRoutes[x]).find("Trip");
                            var trips = [];

                            if(availableTrips.length == 0) {
                                console.log('no trips found');
                                console.log(busInfo);
                            }
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

    .factory('Error', function() {
        return {
            OCError : function(desc) {
                return {
                    title: "OC Transpo Error",
                    desc: desc
                };
            }
        }
    })
;
