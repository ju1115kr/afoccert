/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.directive('scroll',function($window){
    return function(scope, ele, attr){
        angular.element($window).bind('scroll',function(){
            scope.visible = false;
            var _docu = angular.element(document);
            var _wind = angular.element(window);
            if(_docu.height() === _docu.scrollTop()+_wind.height()){
                scope.$broadcast('scrollBottom');
            }
            scope.$apply();
        })
    }
})
