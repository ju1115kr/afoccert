'use strict';

var app = angular.module('certApp');

app.directive('cardToolbar', function(){
	// Runs during compile
	return {
		// name: '',
		// priority: 1,
		// terminal: true,
		// scope: {}, // {} = isolate, true = child, false/undefined = no change
		controller: function($scope, $element, $attrs, $transclude, Toolbar) {
			$scope.toolbar = Toolbar.get();
		},
		// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
		restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
		template: '<ul class="toolbar fold">\
		<li ng-repeat="option in toolbar">\
		<button ng-click="option.func()"><span class="{{option.icon}}"></span></button>\
		</li>\
		</ul>',
		// templateUrl: '',
		// replace: true,
		// transclude: true,
		// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
		link: function($scope, iElm, iAttrs, controller) {
			
		}
	};
});