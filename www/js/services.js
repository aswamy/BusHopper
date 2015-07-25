angular.module('bushopper.services', [])

    .factory('$localstorage', ['$window', function($window) {
        return {
            setObject: function(key, value) {
                $window.localStorage[key] = JSON.stringify(value);
            },
            getObject: function(key, defaultValue) {
                return JSON.parse($window.localStorage[key] || defaultValue);
            }
        }
    }])

    .factory('StopService', function($localstorage) {
        console.log('stop service ran');

        var data = {
            stopNum: '',
            selectedRouteSet: [],
            favoriteRouteSets: [],  // 2D array of RouteInfo
            recentRouteSets: []     // 2D array of RouteInfo
        };

        function parseLocalStorage(routeSets, localData) {
            for (var i = 0; i < localData.length; i++) {
                routeSets.push([]);
                for (var j = 0; j < localData[i].length; j++) {
                    routeSets[i].push(
                        new RouteInfo(
                            localData[i][j].num,
                            localData[i][j].desc,
                            localData[i][j].stop
                        )
                    );
                }
            }
        }

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

        parseLocalStorage(data.recentRouteSets, $localstorage.getObject('recentRouteSets', '[]'));
        parseLocalStorage(data.favoriteRouteSets, $localstorage.getObject('favoriteRouteSets', '[]'));

        return {
            getStop: function() { return data.stopNum; },
            setStop: function(n) { data.stopNum = n; },

            setSelectedRouteSet: function(rs) { data.selectedRouteSet = rs },
            getSelectedRouteSet: function() { return data.selectedRouteSet },
            clearSelectedRouteSet: function() { data.selectedRouteSet = [] },

            addRecentRouteSet: function(rs) {
                for (var i = 0; i < data.recentRouteSets.length; i++) {
                    if(isRouteSetEqual(rs, data.recentRouteSets[i])) {
                        data.recentRouteSets.splice(i, 1);
                        break;
                    }
                }
                data.recentRouteSets.push(rs);
                while(data.recentRouteSets.length > 5) {
                    data.recentRouteSets.shift();
                }
                $localstorage.setObject('recentRouteSets', data.recentRouteSets);
            },
            getAllRecentRouteSets: function() { return data.recentRouteSets; },
            setRecentRouteSets: function(rss) { data.recentRouteSets = rss; },

            isRouteSetFavorited: function(rs) {
                for (var i = 0; i < data.favoriteRouteSets.length; i++) {
                    if(isRouteSetEqual(rs, data.favoriteRouteSets[i]))
                        return true;
                }
                return false;
            },
            addFavoriteRouteSet: function(rs) {
                data.favoriteRouteSets.push(rs);
                $localstorage.setObject('favoriteRouteSets', data.favoriteRouteSets);
            },
            removeFavoriteRouteSet: function(rs) {
                for (var i = 0; i < data.favoriteRouteSets.length; i++) {
                    if(isRouteSetEqual(rs, data.favoriteRouteSets[i])) {
                        data.favoriteRouteSets.splice(i, 1);
                        break;
                    }
                }
                $localstorage.setObject('favoriteRouteSets', data.favoriteRouteSets);
            },
            getAllFavoriteRouteSets: function() { return data.favoriteRouteSets; },
            setFavoriteRouteSets: function(rss) { data.favoriteRouteSets = rss; }
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
                    // console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
                },
            getBusInfo :
                function(stopNum, busNum) {
                    var requestUrl = '/api/GetNextTripsForStop';
                    var requestParams = ocParams.join("&") + "&stopNo=" + stopNum + "&routeNo=" + busNum;
                    // console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
                },
            getAllBusInfo :
                function(stopNum) {
                    var requestUrl = '/api/GetNextTripsForStopAllRoutes';
                    var requestParams = ocParams.join("&") + "&stopNo=" + stopNum;
                    // console.log("Calling: " + requestUrl + "?" + requestParams);
                    return $http.post(requestUrl, requestParams);
                },
            parseStopInfo :
                function(stopInfo) {
                    var buses = [];
                    var xml = $($.parseXML(stopInfo));
                    var stopRoutes = xml.find("Route");
                    var stopNum = xml.find("StopNo").text();

                    for (var x = 0; x < stopRoutes.length; x++) {
                        buses.push(
                            new RouteInfo(
                                $(stopRoutes[x]).find("RouteNo").text(),
                                $(stopRoutes[x]).find("RouteHeading").text(),
                                stopNum
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
                    }

                    for (var x = 0; x < stopRoutes.length; x++) {
                        if($(stopRoutes[x]).find("RouteLabel").text() == selectedRoute.getRouteDesc()) {
                            var availableTrips = $(stopRoutes[x]).find("Trip");
                            var trips = [];

                            if(availableTrips.length == 0) {
                                console.log('no trips found');
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
                $state.go('selectRoutes');
            },
            goShowTrips : function() {
                $state.go('showTrips');
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
