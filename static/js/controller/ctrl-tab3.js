'use strict';

var app = angular.module('certApp');

app.controller('Tab3Ctrl',function($location, $window){
	// $location.path('http://54.1.1.94/dokuwiki');
	// $window.location = 'http://54.1.1.94/dokuwiki';
	$window.open('http://54.1.1.94/dokuwiki');
})