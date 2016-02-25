'use strict';

var app = angular.module('certApp');

app.directive("krInput", function() {
	return {
		priority: 2,
		restrict: 'A',
		compile: function(element) {
			element.on('compositionstart', function(e) {
				e.stopImmediatePropagation();
			});
		},
	};
});