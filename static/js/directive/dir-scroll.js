/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app
    .directive('scroll',function($window){
        return function(scope, ele, attr){
            angular.element($window).bind('scroll',_.throttle(function(){
                scope.visible = false;
                var _docu = angular.element(document);
                var _wind = angular.element(window);
                if(_docu.height() === _docu.scrollTop()+_wind.height()){
                    scope.$broadcast('scrollBottom');
                }
                scope.$apply();
            },10))
        }
    })
    .directive('overlap', function($window, _){
        return {
            scope: {
                overlapped : "=overlap"
            },
            controller: function($scope){
                $scope.overlapped = false;
            },
            link : function(scope, ele, attr){
                angular.element($window).bind('scroll', _.throttle(function(){
                    var _target = angular.element(ele);
                    var _docu = angular.element(document);
                    if(_target.height()+_target.offset().top <= _docu.scrollTop()){
                        scope.overlapped = {
                            state : true,
                            height : _target.height()
                        };
                    }else{
                        scope.overlapped = {
                            state : false,
                            height : _target.height()
                        };
                    }
                }, 10))
            }
        }
    })
