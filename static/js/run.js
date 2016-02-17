/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.run(function($http, $rootScope){
	$rootScope.$on('forbidden', function(){
	})
})
