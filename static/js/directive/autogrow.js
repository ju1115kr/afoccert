'use strict';

var app = angular.module('certApp');

app.directive("autogrow", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs, ngModel) {
           element.autoGrowInput({ minWidth: 10, maxWidth: 600, comfortZone: 40 });
        }
    };
});
