angular.module('bushopper.controllers', [])

    .controller('DashCtrl', function ($scope, $ionicHistory, StopService, Navigation) {
        $scope.search = {
            stopNum : '',
            showSearchSuggestions : false,
            focusSearch : false,
            refreshSearch : function() {
                this.stopNum = '';
                this.showSearchSuggestions = false;
                this.focusSearch = false;
            },
            searchStop : function(stop) {
                StopService.setStop(stop.split(" - ")[0]);
                StopService.clearSelectedRouteSet();
                Navigation.goSelectRoute();
            },
            searchChange : function() {
                this.showSearchSuggestions = this.stopNum.length > 1 ? true : false;
            }
        };

        $scope.allStops = allStopsArr;

        $scope.options = {
            showDeleteRecent : false,
            showReorderFavorite : false,
            showDeleteFavorite : false,
            moveFavoriteRoute : function(item, fromIndex, toIndex) {
                $scope.favoriteRouteSets.splice(fromIndex, 1);
                $scope.favoriteRouteSets.splice(toIndex, 0, item);

                StopService.setFavoriteRouteSets($scope.favoriteRouteSets);
            },
            deleteRecentRoute : function(item) {
                $scope.recentRouteSets = StopService.removeRecentRouteSet(item).slice().reverse();
            },
            deleteFavoriteRoute : function(item) {
                $scope.favoriteRouteSets = StopService.removeFavoriteRouteSet(item);
            },
            refreshOptions : function() {
                this.showReorderFavorite = false;
                this.showDeleteFavorite = false;
                this.showDeleteRecent = false;
            }
        };

        $scope.selectRouteSet = function(rs) {
            // Add route set to history & pass it to result page
            StopService.addRecentRouteSet(rs);
            StopService.setSelectedRouteSet(rs);
            StopService.setStop(rs[0].getRouteStop());

            Navigation.goShowTrips();
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            $scope.recentRouteSets = StopService.getAllRecentRouteSets().slice().reverse();
            $scope.favoriteRouteSets = StopService.getAllFavoriteRouteSets();
            $scope.options.refreshOptions();
            $scope.search.refreshSearch();
        });

        $ionicHistory.nextViewOptions({
            disableBack: true
        });
    })

    .controller('SelectRoutes', function ($scope, $ionicHistory, OC, StopService, Navigation, Alert) {
        var prevStop = '';
        var currStop = '';

        $scope.stopTitle = '';
        $scope.availableRoutes = [];

        $scope.updateContent = function() {
            Alert.displayLoading();

            OC.getStopInfo(currStop)
                .success(function(data, status, headers, config) {
                    $scope.availableRoutes = OC.parseStopInfo(data);
                    Alert.hideLoading();
                    prevStop = currStop;
                })
                .error(function(data, status, headers, config) {
                    Alert.hideLoading();
                    Alert.displayError("Cannot connect to OCTranspo Server", "Check your internet connection. If you are connected, OCTranspo API might be down.", Navigation.goDashboard);
                })
                .then(function() {
                })
            ;
        };

        $scope.selectRoute = function(r) {
            var selectedRoutes = [];
            selectedRoutes.push(r);

            // Add route set to history & pass it to result page
            StopService.addRecentRouteSet(selectedRoutes);
            StopService.setSelectedRouteSet(selectedRoutes);

            Navigation.goShowTrips();
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            StopService.clearSelectedRouteSet();
            currStop = StopService.getStop();

            if (typeof currStop == 'undefined' || currStop == '') {
                Alert.displayError("ERROR: Stop Number", "Stop number cannot be empty.", Navigation.goDashboard);
            } else if (prevStop != currStop || prevStop == '') {
                $scope.availableRoutes = [];
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });

        $ionicHistory.nextViewOptions({
            disableBack: true
        });
    })

    .controller('ShowTrips', function ($scope, $ionicHistory, OC, StopService, Navigation, Alert) {
        var currentRoutes;
        var currStop = '';

        $scope.stopTitle = '';
        $scope.routeTitle = '';
        $scope.availableTrips = [];
        $scope.isRouteSetFavorite = false;

        $scope.updateContent = function() {
            Alert.displayLoading();

            if(currentRoutes.length == 1) {
                $scope.routeTitle = 'Route ' + currentRoutes[0].num;
                OC.getBusInfo(currStop, currentRoutes[0].num)
                    .success(function(data, status, headers, config) {
                        $scope.availableTrips = OC.parseBusInfo(data, currentRoutes[0]);

                        $scope.isRouteSetFavorite = StopService.isRouteSetFavorited(currentRoutes);
                        Alert.hideLoading();
                    })
                    .error(function(data, status, headers, config) {
                        Alert.hideLoading();
                        Alert.displayOCError(Navigation.goDashboard);
                    })
                    .then(function() {
                    })
            } else {
                $scope.routeTitle = 'All Routes';
                console.log("to be implemented");
                Alert.hideLoading();
            }
        };

        $scope.toggleFavoriteRouteSet = function() {
            if($scope.isRouteSetFavorite) {
                $scope.isRouteSetFavorite = false;
                StopService.removeFavoriteRouteSet(currentRoutes);
            } else {
                $scope.isRouteSetFavorite = true;
                StopService.addFavoriteRouteSet(currentRoutes);
            }
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            currentRoutes = StopService.getSelectedRouteSet();
            currStop = StopService.getStop();

            if (currentRoutes.length == 0 || typeof currStop == 'undefined' || currStop == '') {
                Alert.displayError("ERROR: Route Number/Direction", "Route information cannot be empty.", Navigation.goDashboard);
            } else {
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });

        $ionicHistory.nextViewOptions({
            disableBack: true
        });
    })
;