/**
 * Created by cert on 2016-01-26.
 */

'use strict';

var app = angular.module('certApp');

app.factory('User',function($resource){
    if(!window.test_version){
        return $resource(window.api_url+'/users/:userId',{},{
            signup:{
                method:'POST'
            },update:{
                method:'PUT'
            },getNews:{
                url:window.api_url+'/users/:userId/news',
                method:'GET'
            }
        })
    }
})
