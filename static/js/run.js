/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.run(function($http, $rootScope, Global, $timeout){
	$rootScope.unauthorizedReq = [];
	$rootScope.$on('forbidden', function(){

	});
	$rootScope.$on('unauthorized', function(){
		if(Global.isLoggedIn()){
			Global.updateData({isExpired :  true})
			$timeout(function(){
				angular.element("#btn-2").click();
			})
		}
	});
})
