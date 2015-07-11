angular.module('bushopper.controllers', [])

    .controller('DashCtrl', function ($scope, $state, StopService) {
        $scope.data = {
            stopnum : ''
        };
        $scope.updateStop = function() {
            StopService.set($scope.data.stopNum);
            $state.go('selectbus', { "nav-direction" : "back"});
        };

        $scope.$on('$ionicView.beforeLeave', function(){
            StopService.set($scope.data.stopNum);
        });
    })

    .controller('SelectBus', function ($scope, $state, $ionicLoading, $ionicPopup, OC, StopService) {

        var prevStop = '';
        var currStop = '';

        var displayAlert = function(title, msg, cb) {
            $ionicPopup.alert({
                title: title,
                template: msg,
                okType: 'button-assertive'
            }).then(cb);
        };

        var returnToDash = function() {
            $state.go('dash');
        };

        $scope.stopTitle = '';
        $scope.routes = [];

        $scope.updateContent = function() {
            $ionicLoading.show({ templateUrl: 'templates/misc/loading.html'});

            OC.getStopInfo(currStop)
                .success(function(data, status, headers, config) {
                    $scope.routes = OC.parseStopInfo(data);
                    console.log($scope.routes);
                    $ionicLoading.hide();
                    prevStop = currStop;
                })
                .error(function(data, status, headers, config) {
                    $ionicLoading.hide();
                    displayAlert("Cannot connect to OCTranspo Server", "Check your internet connection. If you are connected, OCTranspo API might be down.", returnToDash);
                })
                .then(function() {
                })
            ;
        };

        $scope.$on('$ionicView.beforeEnter', function() {
            currStop = StopService.get();
            if (typeof currStop == 'undefined' || currStop == '') {
                displayAlert("ERROR: Stop Number", "Stop number cannot be empty.", returnToDash);
            } else if (prevStop != currStop || prevStop == '') {
                $scope.routes = [];
                $scope.stopTitle = currStop;
                $scope.updateContent();
            }
        });
    })

    .controller('Result', function ($scope, StopService) {

    })
;