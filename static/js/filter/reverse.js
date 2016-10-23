'use strict';

var app = angular.module('certApp');

app.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
}).filter('convertByte', function(){
    return function(size){
        var unitStr = 'KMGT';
        var ret = '';
        for(var i=0; i<4 ;i++){
            size = Math.floor(size/1024);
            if(size<1024){
                ret = size+unitStr[i]+'B';
                break;
            }
        }
        return ret;
    }
})