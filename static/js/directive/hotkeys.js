'use strict';

var app = angular.module('certApp');

app.directive("hotkeys", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs, ngModel) {
            var hotkeys = attrs.hotkeys,
                fn = attrs.hotkeyFn;
            console.log(hotkeys)
            console.log(fn)
            //element.bind('keydown', hotkeys, fn);
        }
    };
});
