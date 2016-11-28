/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.factory('Push',function($resource){
    if(!window.test_version){
        return $resource(window.api_url+'/pushs/:userId',{});
    }
})
