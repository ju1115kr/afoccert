'use strict';
var app = angular.module('certApp');

app.controller('TagsCtrl', function($scope, $q, Tags) {
	/**
	 * 태그 조회
	 */
	function fetchTags() {
		var deferred = $q.defer();
		Tags.get(function(tags) {
			deferred.resolve(tags);
		});
		return deferred.promise;
	}
	fetchTags().then(function(tags) {
		$scope.tags = tags.tags;
	});
	/**
	 * 태그 생성
	 */
	$scope.tagInput = {
		ele: angular.element("#tagInput"),
		value: '',
		create: function() {
			var that = this;
			Tags.create({
				name: this.value
			},function(){
				$scope.tags.push({'name':that.value});
				that.value = '';
			});
		}
	}
	$scope.tagInput.ele.autoGrowInput({
		minWidth: 50,
		comfortZone: 10
	});
})