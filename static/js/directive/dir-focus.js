'use strict';

var app = angular.module('certApp');

app.directive('safeAutoFocus',function($timeout){
    return{
        restrict : 'A',
        controller: function($scope){
        },
        link: function($scope, ele, attr){
            $timeout(function(){
                if(attr['safeAutoFocus']=='true'){
                    if(attr['contenteditable']=='true'){
                        placeCaretAtEnd(ele[0]);
                    }else{
                        ele[0].focus();
                    }
                }
            },0);
        }
    }
})
/**
 * Created by cert on 2016-11-29.
 */
