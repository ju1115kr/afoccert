'use strict';

var app = angular.module('certApp');

app.factory('HashList', function($resource, $q, Tags, User) {
	return {
		get: function(indicator) {
			var deferred = $q.defer();
			switch (indicator) {
				case '@':
					var userDeferred = $q.defer();
					User.get(function(users){
						userDeferred.resolve(users.users);
					});
					userDeferred.promise.then(function(users){
						var ret = [];
						users.forEach(function(user){
							ret.push({
								name:user.realname,
								username:user.username
							});
							deferred.resolve(ret);
						})
					});
					break;
				case '#':
					Tags.get(function(result){
						deferred.resolve(result.tags);
					});
					break;
			}
			return deferred.promise;
		}
	}
});