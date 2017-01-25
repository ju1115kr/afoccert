'use strict';

angular.module('certApp')
    .controller('Tab1DetailCtrl', function($scope, $routeSegment, $route, $location, $window, $q, Issue){
        $scope.getRouteParam = function(){
            var key = $routeSegment.chain[2].params.dependencies[0];
            key = key||'id' //cannot guarantee resolving 'key'; sometimes it is initialized by 'undeifined'
            var paramValue = $route.current.params[key];
            $scope.model = Issue.query({issueId:paramValue}).$promise;
        };


        $scope.backdrop = function(){
            $window.history.back();
        }
    })