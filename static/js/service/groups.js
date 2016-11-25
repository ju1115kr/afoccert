'use strict';

var app = angular.module('certApp');

app.factory('Groups', function($resource, $q){
    return $resource(window.api_url+'/groups/:groupId',{},{
        query : {
            // url: window.api_url+'/groups',
            method: 'GET',
            isArray: false,
        },
        create: {
            method: 'POST',
        },
        update: {
            method: 'PUT',
        }
    })
})
