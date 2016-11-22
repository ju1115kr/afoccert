'use strict';

angular.module('certApp')

.controller('ModalGroupPolicyCtrl', function ($scope, $uibModalInstance, $q, $timeout, Groups, User) {
    $scope.groupFetched = false;
    $timeout(function(){
        $scope.groupFetched = true;
    },2000)
    $scope.groups = [];
    $scope.users = [];
    var userDeferred = $q.defer();
    var groupDeferred = $q.defer();
    User.get(function(data) {
        userDeferred.resolve(data.users);
    });
    Groups.query(function(policies) {
        groupDeferred.resolve(policies.groups);
    });

    userDeferred.promise.then(function(users) {
        $scope.users = users;
    });
    groupDeferred.promise.then(function(groups) {
        $scope.groups = groups;
    });

    $scope.createdGroup = {
        name:'',
        users:[],
        error:false
    }

    $scope.selectedGroup = null;

    $scope.submitGroup = function() {
        if($scope.createdGroup.name.length!==0){
            var pos=-1;
            $scope.groups.forEach(function(g,i){
                if(g.name == $scope.createdGroup.name){
                    pos = i;
                }
            })
            if(pos==-1){
                $scope.createdGroup.error = false;
                $scope.selectedGroup = $scope.createdGroup;
            }else{
                $scope.createdGroup.error = true;
            }
        }
    }

    $scope.indexOfGroup = function(user, group) {
        var ret = -1;
        if(group && group.users){
            group.users.forEach(function(u, i){
                if(u.username == user.username){
                    ret = i;
                }
            })
        }
        return ret;
    };

    $scope.indexOfGroups = function(group){
        var ret = -1;
        $scope.groups.forEach(function(g, i){
            if(g.name == group.name){
                ret = i;
            }
        })
        return ret;
    }

    $scope.toggleMember = function(user, group) {
        var i = $scope.indexOfGroup(user, group);
        if(i==-1){
            group.users.push(user);
        }else{
            group.users.splice(i,1);
        }
    };

    $scope.unselectGroup = function() {
        $scope.createdGroup = {
            name:'',
            users:[],
            error: false
        };
        $scope.selectedGroup = null;
    };

    $scope.saveGroup = function() {
        /*
        Groups.create({
            'name' : $scope.selectedGroup.name,
            'description': '',
            'users': (function(){
                var ret = [];
                $scope.selectedGroup.users.forEach(function(user){
                    ret.push(user.username);
                })
                return ret;
            }())
        }, function(group){
            $scope.groups.push(group);
        })
        */
        $timeout(function(){
            var pos = $scope.indexOfGroups($scope.selectedGroup);
            if(pos==-1) {
                $scope.groups.push({
                    'name': $scope.selectedGroup.name,
                    'description': '',
                    'users': $scope.selectedGroup.users
                });
            }else{
                $scope.groups[pos] = $scope.selectedGroup;
            }
            $scope.unselectGroup();
        })
    }

    $scope.configGroup = function(group){
        $scope.selectedGroup = angular.copy(group);
    }
})
