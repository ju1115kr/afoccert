'use strict';

var app = angular.module('certApp');

app.factory('Issue', function ($resource, $sce, $q) {

    return $resource(window.api_url+'/issues/:issueId',{},{
        dummy: {
            url: window.api_url+'/news/:newsId/issues',
            method: 'POST'
        },
        save: {
            url: window.api_url+'/news/:newsId/issues/:ancestorId'
        },
        query:{
            method:'GET'
        },
        queryAll:{
            method:'GET',
            isArray:true,
            transformResponse: function(data){
                try {
                    data = JSON.parse(data);
                    return data;
                } catch (e) {
                    return;
                }
            }
        },
        delete:{
            url: window.api_url+'/issues/:ancestorId',
            method :'DELETE'
        }
    });
});
