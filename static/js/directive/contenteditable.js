'use strict';

var app = angular.module('certApp');

app.directive("contenteditableee", function() {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {

            function read() {
                setTimeout(function(){ngModel.$setViewValue(element.html());},100)
            }

            ngModel.$render = function() {
                element.html(ngModel.$viewValue || "");
            };

            element.bind("blur keyup change", function() {
                scope.$apply(read);
            });
        }
    };
});