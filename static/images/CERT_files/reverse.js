'use strict';

var app = angular.module('certApp');

app.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});
