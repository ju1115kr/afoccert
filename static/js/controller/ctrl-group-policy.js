'use strict';

angular.module('certApp')

.controller('ModalGroupPolicyCtrl', function ($scope, $uibModalInstance, $q, $timeout, $http, Groups, User) {
    $scope.groupFetched = false;
    $scope.groups = [];
    $scope.users = [];
    var userDeferred = $q.defer();
    var groupDeferred = $q.defer();
    User.get(function(data) {
        userDeferred.resolve(data.users);
    });
    Groups.query(function(policies) {
        $scope.groupFetched = true;
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
        error:false,
        msg:''
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
                if($scope.createdGroup.name == '전체공개'){
                    $scope.createdGroup.error = true;
                    $scope.createdGroup.msg = '해당 이름은 사용 불가합니다'
                }else{
                    $scope.createdGroup.error = false;
                    $scope.selectedGroup = $scope.createdGroup;
                }
            }else{
                $scope.createdGroup.error = true;
                $scope.createdGroup.msg = '중복된 그룹명입니다.'
            }
        }
    }

    $scope.indexOfGroup = function(user, group) {
        var ret = -1;
        if(group && group.users){
            group.users.forEach(function(u, i){
                if(u == user.username){
                    ret = i;
                }
            })
        }
        return ret;
    };

    $scope.indexOfGroups = function(group){
        var ret = -1;
        if(typeof group.id !== undefined){
            $scope.groups.forEach(function(g, i){
                if(g.id == group.id){
                    ret = i;
                }
            })
        }
        return ret;
    }

    $scope.toggleMember = function(user, group) {
        // console.log(user)
        var i = $scope.indexOfGroup(user, group);
        if(i==-1){
            group.users.push(user.username);
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
        var pos = $scope.indexOfGroups($scope.selectedGroup);
        var obj = {
            'name' : $scope.selectedGroup.name,
            'description': '',
            'users': (function(){
                var ret = [];
                $scope.selectedGroup.users.forEach(function(user){
                    ret.push(user);
                })
                return ret;
            }())
        };
        var getURIResource = function(headers){
            var deferred = $q.defer();
            $http({method: 'GET', url: headers('Location')}).success(function (group, stauts, headers, config) {
                deferred.resolve(group);
            });
            return deferred.promise;
        }
        if(pos==-1){
            //새로 생성
            Groups.create(obj, function(data, headers){
                getURIResource(headers).then(function(group){
                    console.log(group)
                    $scope.groups.push(group);
                })
                // $scope.groups.push(getURIResource(headers));
            })
        }else{
            //수정
            Groups.update({
                'groupId':$scope.selectedGroup.id,
            }, obj, function(data, headers){
                /* TODO : backend 제대로 리턴 안해줌!!!! */
                $scope.groups[pos] = data;
            })
        }
        $scope.unselectGroup();
    }

    $scope.configGroup = function(group){
        $scope.selectedGroup = angular.copy(group);
    }
})
