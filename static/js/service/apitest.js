'use strict';

var app = angular.module('certApp');

app.factory('Apitest', function ($resource, $sce) {
	return $resource(window.api_url+'/news', {
            }, {
                query: {
                    method: 'GET'
                },
                post:{
                    method: 'POST'
                }
            }
        );
})
.factory('Token',function($resource){
	return $resource(window.api_url+'/token',{

	},{
		submit:{
			method:'GET'
		}
	})
});