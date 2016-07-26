'use strict';

var app = angular.module('certApp');

app.factory('Groups', function($resource){
    return $resource(window.api_url+'/groups/:groupName',{},{
        query : {
            url: window.api_url+'/groups',
            method: 'GET',
            isArray: false,
        },
        create: {
            method: 'POST'
        }
    })
})
