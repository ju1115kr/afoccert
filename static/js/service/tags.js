/**
 * Created by cert on 2016-01-26.
 */

'use strict';

var app = angular.module('certApp');

app.factory('Tags', function($resource) {
	return $resource(window.api_url + '/tags', {}, {
		get: {
			method: 'GET'
		},
		create: {
			method: 'POST'
		}
	})
})