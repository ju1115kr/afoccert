'use strict';

angular.module('certApp').
controller('IndexCtrl', function($scope, $rootScope, $location, RouteLinkProvider, Global, User, popoverUtils, PopoverProvider){
    $scope.section = '';
    $scope.link_provider = RouteLinkProvider;
    $scope.navObject =
    {
        header : {
            buttons: [
                {
                    name: '알림',
                    icon: 'glyphicons glyphicons-bell',
                    popover : function(){
                        return $scope.getPush()
                    }
                },
                {
                    name: '내 정보',
                    icon: 'glyphicons glyphicons-user',
                    popover: function(){
                        return $scope.userInfo()
                    }
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
 $scope.popover = popoverUtils
            $scope.popoverToggle = $scope.popover.toggle;

    $scope.global = Global;

    $scope.user = {
        id:'',
        pw:'',
        pwcf:'',
        name:'',
        loading:false
    }
    $scope.signupForm = false;
    $scope.signin = function(){
        $scope.user.loading = true;
        $scope.global.login(
            $scope.user.id,
            $scope.user.pw,
            function(){
                $location.path('/tab1')
                $scope.user.loading = false;
            },
            function(){
                $scope.user.loading = false;
            }
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

    $scope.toggleSignup = function(){
        $scope.signupForm = !$scope.signupForm;
    }

    $scope.submit = function(){
        if(!$scope.signupForm){
            $scope.signin();    
        }else{
            $scope.signup();
        }
    }

    $scope.getPush = function(){
        PopoverProvider.open({
            controller : 'helloCtrl',
            position : 'bottom',
            templateUrl : '/partials/partial-push-popover.html',
            resolve : {
                Init : function(){
                    return 'success!'
                }
            }
        });
    }
    $scope.userInfo = function(){
        PopoverProvider.open({
            controller : 'userInfoCtrl',
            position : 'bottom',
            templateUrl : '/partials/partial-userinfo-popover.html'
        });
    }
    
}).
controller('helloCtrl',function($scope, $injector){
    $scope.isOkay = function(){
        console.log($injector.get('Init'));
    } 
}).
controller('userInfoCtrl',function($scope, $location, Global){
    $scope.logout = function(){
        Global.logout();
        $location.path('/');
    }
})
