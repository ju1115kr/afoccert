'use strict';

angular.module('certApp').
controller('IndexCtrl', function($scope, $rootScope, $location, RouteLinkProvider, Global, User, popoverUtils, PopoverTrigger){
    $scope.section = 'index';
    $scope.link_provider = RouteLinkProvider;
    $scope.navObject =
    {
        header : {
            buttons: [
                {
                    id:'btn-1',
                    name: '알림',
                    icon: 'glyphicons glyphicons-bell',
                    popover : function(){
                        return $scope.getPush()
                    }
                },
                {
                    id:'btn-2',
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
                    icon: 'glyphicons glyphicons-inbox'
                },
                {
                    name: '위키',
                    link: 'tab3',
                    icon: 'glyphicons glyphicons-book'
                },
                {
                    name: '관리자',
                    link: 'admin',
                    icon: 'glyphicons glyphicons-keys'
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
    if($scope.global.isLoggedIn()){
        $location.path('/tab1')
    }
    $scope.signInit = function(){
        $scope.user = {
            id:'',
            pw:'',
            pwcf:'',
            name:'',
            loading:false,
            error:false
        }
    }
    $scope.signupForm = false;
    $scope.signin = function(){
        $scope.user.loading = true;
        $scope.global.login(
            $scope.user.id,
            $scope.user.pw,
            function(){
                $scope.signInit();
                $location.path('/tab1')
            },
            function(){
                $scope.user.loading = false;
                $scope.user.error = true;
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
        PopoverTrigger({
            controller : 'helloCtrl',
            position : 'bottom',
            templateUrl : '/partials/partial-push-popover.html',
            resolve : {
                Init : function(){
                    return 'success!'
                },
                Finish: function(){
                    return 'bye'
                }
            }
        }).then(function(message){
            console.log(message)
        })
    };

    $scope.userInfo = function(){
        PopoverTrigger({
            controller : 'userInfoCtrl',
            position : 'bottom',
            resolve : {
                Test: function(){
                    return 'test'
                }
            },
            templateUrl : '/partials/partial-userinfo-popover.html'
        });

    };

    $rootScope.interface = {
        dracula : false
    }

}).
controller('helloCtrl',function($scope, $popoverInstance, Init){
    $scope.message = Init;
    $scope.close = function(message){
        $popoverInstance.close(message);
    }
}).
controller('userInfoCtrl',function($rootScope, $scope, $location, $http, Global, Store, $popoverInstance, User){
    $scope.global = Global;
    function initUser(){
        $scope.user = {
            id:'',
            pw:'',
            pwcf:'',
            name:'',
            update: false,
            switched: false,
            loading:false
        }
    }
    initUser();
    function determineState(){
        $scope.state = [
            $scope.global.user.isExpired,
            !$scope.global.user.isExpired && !$scope.user.update && !$scope.user.switched,
            !$scope.global.user.isExpired && $scope.user.update && !$scope.user.switched,
            !$scope.global.user.isExpired && !$scope.user.update && $scope.user.switched
        ];
        if($scope.global.user.isExpired){
            $scope.user.id = $scope.global.user.userId;
        }else{
            if(!$scope.user.switched){
                User.get({userId:$scope.global.user.userId},function(result){
                    $scope.user.name = result.realname;
                    $scope.user.id = result.username;
                });
            }
        }
    }
    determineState();
    /* STATE 0 */
    $scope.signin = function(){
        if($scope.user.id.length!=0 && $scope.user.pw.length!=0){
            Store.set('user',null);
            $scope.global.login(
                $scope.user.id,
                $scope.user.pw,
                function(){
                    $rootScope.$broadcast('update:user'); //broadcast to news directives
                    var req = $rootScope.unauthorizedReq;
                    for(var i=0; i<req.length; i++){
                        retry(req[i]);
                    }
                    $rootScope.unauthorizedReq = [];

                    $popoverInstance.close();
                },
                function(){
                    $scope.user.loading = false;
                }
            );
        }
    }

    function retry(req){
        $http(req.config).then(function(response){
            req.deferred.resolve(response);
        })
    }

    /* STATE 1 */
    $scope.logout = function(){
        Global.logout();
        $location.path('/');
    }

    /* STATE 2 */
    $scope.modifyUser = function(){
        $scope.user.update = true;
        $scope.tempUser = {
            name:$scope.user.name,
            pw:'',
            pwcf:''
        }
        determineState();
    }

    $scope.update = function(){
        if($scope.tempUser.name.length!=0 && $scope.tempUser.pw.length!=0 && $scope.tempUser.pw == $scope.tempUser.pwcf){
            User.update(
                {userId:$scope.global.user.userId},
                {pw:$scope.tempUser.pw, name:$scope.tempUser.name},
                function(result){
                    $scope.dismiss();
                }
            )
        }
    }

    $scope.dismiss = function(){
        initUser();
        $scope.user.update = false;
        $scope.user.switched = false;
        determineState();
    }

    /* STATE 3 */
    $scope.switchUser = function(){
        initUser();
        $scope.user.switched = true;
        determineState();
    };
})
