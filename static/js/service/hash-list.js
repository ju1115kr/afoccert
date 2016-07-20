'use strict';

var app = angular.module('certApp');

app.factory('HashList', function($resource, $q, Tags) {
	return {
		get: function(indicator) {
			var deferred = $q.defer();
			switch (indicator) {
				case '@':
					deferred.resolve([{
						name: '신규현'
					}, {
						name: '성연복'
					}, {
						name: '정성민'
					}, {
						name: '이주석'
					}, {
						name: '이주영'
					}, {
						name: '차현탁'
					}, {
						name: '김성민'
					},{
						name: '이동현'
					}]);
					break;
				case '#':
					Tags.get(function(result){
						console.log(result)
						deferred.resolve(result.tags);
					});
					break;
			}
			return deferred.promise;
		}
	}
});