'use strict';

var app = angular.module('certApp');

app.factory('Issue', function ($resource, $sce, $q) {

    return $resource(window.api_url+'/issues/:issueId',{},{
        dummy: {
            method: 'POST'
        },
        assignNews: {
            url: window.api_url+'/issues/:ancestorId/news/:newsId',
            method:'POST'
        },
        query:{
            method:'GET',
            isArray: false
        },
        delete:{
            url: window.api_url+'/issues/:ancestorId',
            method :'DELETE'
        },
        queryNews:{
            url: window.api_url+'/issues/:issueId/news',
            method:'GET',
            isArray: false
        }
    });
});
