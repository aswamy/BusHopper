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
    })

    .controller('SelectBus', function ($scope, OC, StopService, Navigation, Alert) {

        var prevStop = '';
        var currStop = '';

        $scope.stopTitle = '';
        $scope.routes = [];

        $scope.updateContent = function() {
            Alert.displayLoading();

            OC.getStopInfo(currStop)
                .success(function(data, status, headers, config) {
                    $scope.routes = OC.parseStopInfo(data);
                    Alert.hideLoading();
                    prevStop = currStop;
                })
                .error(function(data, status, headers, config) {
                    Alert.hideLoading();
                    Alert.displayError("Cannot connect to OCTranspo Server", "Check your internet connection. If you are connected, OCTranspo API might be down.", returnToDash);
                })
                .then(function() {
                })
            ;
        };

        $scope.selectRoute = function(num, dir) {
            StopService.insertRouteInfo(num, dir);
            Navigation.goResults();
        };

        $scope.selectAllRoutes = function() {
            StopService.setRouteInfo($scope.routes);
            Navigation.goResults();
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            currStop = StopService.getStop();
            if (typeof currStop == 'undefined' || currStop == '') {
                Alert.displayError("ERROR: Stop Number", "Stop number cannot be empty.", Navigation.goDashboard);
            } else if (prevStop != currStop || prevStop == '') {
                $scope.routes = [];
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });
    })

    .controller('Result', function ($scope, OC, StopService, Navigation, Alert) {

        var currentRoutes;
        var currStop = '';

        $scope.stopTitle = '';

        $scope.updateContent = function() {
            Alert.displayLoading();

            OC.getStopInfo(currStop)
                .success(function(data, status, headers, config) {
                    $scope.routes = OC.parseStopInfo(data);
                    Alert.hideLoading();
                    prevStop = currStop;
                })
                .error(function(data, status, headers, config) {
                    Alert.hideLoading();
                    Alert.displayError("Cannot connect to OCTranspo Server", "Check your internet connection. If you are connected, OCTranspo API might be down.", returnToDash);
                })
                .then(function() {
                })
            ;

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