angular.module('bushopper.controllers', [])

    .controller('DashCtrl', function ($scope, StopService, Navigation) {
        $scope.data = {
            stopnum : ''
        };

        $scope.updateStop = function() {
            StopService.setStop($scope.data.stopNum);
            StopService.clearRouteInfo();
            Navigation.goSelectRoute();
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            $scope.recentRouteSets = StopService.getAllRecentRouteSets().slice().reverse();
            $scope.favoriteRouteSets = StopService.getAllFavoriteRouteSets();
        });
    })

    .controller('SelectRoutes', function ($scope, OC, StopService, Navigation, Alert) {

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

        $scope.selectRoute = function(num, dir) {
            var rInfo = new RouteInfo(num, dir, currStop);
            var selectedRoutes = [];
            selectedRoutes.push(rInfo);

            // Add route to history
            StopService.addRecentRouteSet(selectedRoutes);
            // Add route to be passed to result page
            StopService.insertRouteInfo(rInfo);
            Navigation.goShowTrips();
        };

        //$scope.selectAllRoutes = function() {
        //    StopService.setRouteInfo($scope.availableRoutes);
        //    Navigation.goShowTrips();
        //};

        $scope.$on('$ionicView.beforeEnter', function() {
            StopService.clearRouteInfo();
            currStop = StopService.getStop();

            if (typeof currStop == 'undefined' || currStop == '') {
                Alert.displayError("ERROR: Stop Number", "Stop number cannot be empty.", Navigation.goDashboard);
            } else if (prevStop != currStop || prevStop == '') {
                $scope.availableRoutes = [];
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });
    })

    .controller('ShowTrips', function ($scope, OC, StopService, Navigation, Alert) {

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
            currentRoutes = StopService.getRouteInfo();
            currStop = StopService.getStop();

            if (currentRoutes.length == 0 || typeof currStop == 'undefined' || currStop == '') {
                Alert.displayError("ERROR: Route Number/Direction", "Route information cannot be empty.", Navigation.goDashboard);
            } else {
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });
    })
;