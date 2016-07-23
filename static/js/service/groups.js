'use strict';

var app = angular.module('certApp');

app.factory('Groups', function($resource){
    return $resource(window.api_url+'/groups/:groupName',{},{
        query : {
            isArray: true,
            method: 'GET'
        }
    })
})
