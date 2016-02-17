'use strict';

var app = angular.module('certApp');

app.factory('Aside', function (Store,$rootScope) {
    var storedAsides;
    if (Store.get('aside')) {
        storedAsides = Store.get('aside');
    } else {
        storedAsides = Store.set('aside', {});
    }
    $rootScope.asideList = [];
    return {
        get: function (type) {
            $rootScope.asideList = storedAsides[type];
            return storedAsides[type];
        },
        set: function (type, data, leave, rollback) {
            if(!storedAsides[type]){
                storedAsides[type] = [];
            }
            for(var i=0; i<storedAsides[type].length; i++){
               if(storedAsides[type][i].data === data){
                   return;
               }
            }
            storedAsides[type].push({
                "data": data,
                "leave": leave,
                "rollback": rollback
            });
            Store.set('aside', storedAsides);
            $rootScope.asideList = storedAsides[type];
        }
    }

})