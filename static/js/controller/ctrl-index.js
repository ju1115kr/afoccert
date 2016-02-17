'use strict';

angular.module('certApp').controller('IndexCtrl', function($scope, $rootScope, RouteLinkProvider, Global, User){
    $scope.section = '';
    $scope.link_provider = RouteLinkProvider;
    $scope.navObject =
    {
        header : {
            buttons: [
                {
                    name: '먹고싶으셰여?',
                    link: 'analysis-report',
                    icon: 'glyphicons glyphicons-bell'
                },
                {
                    name: '≠이주영 극혐',
                    link: 'analysis-report',
                    icon: 'glyphicons glyphicons-user'
                }
            ]
        },
        sub :{
            buttons:[
                {
                    name: '신송',
                    link: 'tab1',
                    icon:'glyphicons glyphicons-inbox'
                },
                {
                    name: '인포콘',
                    link: 'tab2',
                    icon:'glyphicons glyphicons-skull'
                }
            ]
        }
    }

    $rootScope.resetPopover = function(){
        if($rootScope.rootPopover){
            $rootScope.rootPopover.visible = false;
        }
    }

    $scope.global = Global;

    $scope.user = {
        id:'',
        pw:'',
        pwcf:'',
        name:'',
        loading:false
    }

    $scope.signin = function(){
        $scope.user.loading = true;
        $scope.global.login(
            $scope.user.id,
            $scope.user.pw
        );
    }

    $scope.signup = function(){
        if(!$scope.signupForm){
            $scope.signupForm = true;
        }else{
            User.signup($scope.user,function(data){
                $scope.signin();
            })
        }
    }
})
