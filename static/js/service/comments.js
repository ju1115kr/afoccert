'use strict';

var app = angular.module('certApp');

app.factory('Comments', function($resource){
	return $resource(window.api_url+'/comments/:commentId', {},
	{
		fromNews: {
			method: 'GET',
			url: window.api_url+'/news/:newsId/comments'
		},
		toNews: {
			method: 'POST',
			url: window.api_url+'/news/:newsId/comments'
		},
		delete: {
			method :'DELETE'
		},
		update:{
			method:'PUT'
		}
	})
})