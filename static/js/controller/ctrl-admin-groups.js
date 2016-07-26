'use strict';

var app = angular.module('certApp');

app.controller('GroupsCtrl', function($scope, $q, Groups){
    var Group = function(name, desc, users){
        this.name = name;
        this.desc = desc||'';
        this.users = users||[];
    };
    Group.prototype.getName = function(){
        return this.name;
    };
    Group.prototype.getDesc = function(){
        return this.desc;
    };
    Group.prototype.getUsers = function(){
        return this.users;
    };

    $scope.groups = [];
    var addGroupToEntry = function(group){
        $scope.groups.push(new Group(group.name, group.description, group.users));
    }
    Groups.query(function(result){
        angular.forEach(result.groups, addGroupToEntry)
    });
    $q.all($scope.groups).then(function(groups){
        $scope.groups = groups;
        console.log($scope.groups)
    })

    $scope.groupForm = {
        name: '',
        desc: '',
        users: [],
        createGroup : function(){
            Groups.create({
                'name': this.name,
                'description': this.desc||'',
                'users': this.users||[]
            }, addGroupToEntry);
        }
    }

    $scope.status = {
        isopen: false
    }
});
