'use strict';

/**
 * 로그인 정보 저장용.
 * @name BaseGlobal
 * @param  {$http} http     Core AngularJS service
 * @param  {$resource} resource ngResource service
 * @param  {$location} location location Core AngularJS service
 * @param  {$window} window   window Core AngularJS service
 */
function BaseGlobal(http, resource, location, window) {
    this.http = http;
    this.resource = resource;
    this.location = location;
    this.window = window;
    this.user = null;

    /* check if user has been already logged in */
    var user_string = window.localStorage['user'];
    if (user_string) {
        var user = JSON.parse(user_string);
        if (user) {
            this.user = user;
        }
    }
}

/**
 * 유저가 로그인 되어 있는지를 확인.
 *
 * @name isLoggedIn
 * @function
 * @return {Boolean} 로그인 되어 있을 경우 true, 아닐경우 false
 */
BaseGlobal.prototype.isLoggedIn = function () {
    return this.user !== null;
};


/**
 * 로그인 되지 않았을때 앱 루트로 리디렉트.
 * 꼭 로그인이 필요한 컨트롤러 내에서 호출.
 *
 * @name excludeLogout
 * @function
 * @return {undefined}
 */
BaseGlobal.prototype.excludeLogout = function () {
    if (this.user === null) {
        this.location.path('/');
    }
};

/**
 * 로그인 된 계정을 제외.
 *
 * @name excludeLogin
 * @function
 * @return {undefined}
 */
BaseGlobal.prototype.excludeLogin = function () {
    if (this.user !== null) {
        this.location.path('/');
    }
};

/**
 * 로그인 시도.
 *
 * @name login
 * @function
 * @param {String} username 아이디
 * @param {String} password 비밀번호
 * @param {function} success 성공시 콜백
 * @param {function} failure 실패시 콜백
 * @return {undefined}
 */
BaseGlobal.prototype.login = function (username, password, success, failure) {
    var http = this.http;
    var window = this.window;
    var global = this;
    var base64 = new Base64();
    if (!window.test_version) {
        http({
            method: 'GET',
            url: window.api_url + '/token',
            headers : {'Authorization': 'Basic ' + base64.encode(username+ ":" +password)}
        }).then(function (data, status, headers, config) {
            var jsonString = {token : data.data.token, userId : username};
            window.localStorage.setItem('user', JSON.stringify(jsonString));
             var user_string = window.localStorage['user'];
            if (user_string) {
                var user = JSON.parse(user_string);
                if (user) {
                    global.user = user;
                }
        }
            if(success)
                success();
        },function (data, status, headers, config) {
            if(failure)
                failure();
        });
    } else {
        if (username === 'test' && password === 'test') {
            window.localStorage.setItem('user', JSON.stringify({'id': username}));
            global.user = {'id': username};
            success();
        } else {
            failure();
        }
    }
};

/**
 * 로그인 된 경우 로그아웃후 앱 루트로 이동.
 * @author Il Jae Lee <agiantwhale@gmail.com>
 * @memberOf BaseGlobal
 * @return {undefined}
 */
BaseGlobal.prototype.logout = function () {
    var http = this.http;
    var window = this.window;

    http.defaults.headers.common.AuthToken = null;
    window.localStorage.setItem('user', null);
    this.userPasswordVerified = null;
    this.user = null;
    this.excludeLogout();
};

/**
 * AuthToken과 localstorage 정보를 갱신
 */
BaseGlobal.prototype.updateData = function (data) {
    var http = this.http;
    var window = this.window;
    var user = this.user;

    for (var key in data) {
        for (var keys in user) {
            if (keys === key) {
                user[keys] = data[key];
            }
        }
    }
    http.defaults.headers.common.AuthToken = user.token;
    window.localStorage.setItem('user', JSON.stringify(user));
    this.user = user;
}


function Base64(){
    var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        
    this.encode =  function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

    this.decode = function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
}



angular.module('certApp')
    .factory('Global', function ($http, $resource, $location, $window) {
        var global = new BaseGlobal($http, $resource, $location, $window);
        return global;
    })
    .factory('Base64', function () {
        var base64 = new Base64();
        return base64;
    })
    .factory('Userservice', function($window){
        var service = this;
        var currentuser = null;
        var window = $window;

        service.setCurrentUser = function(user){
            currentuser = user;
            window.localStorage.setItem('user', JSON.stringify(user));
            return currentuser;
        }

        service.getCurrentUser = function(){
            if(!currentuser){
                currentuser = window.localStorage['user'] ? JSON.parse(window.localStorage['user']) : null;
                return currentuser
            }else{
                return currentuser;
            }
        }
        return service;
    })
    .factory('APIIntercepter', function($rootScope, $window, $q, Userservice){
            return{
                request : function(config){
                    var user_string = window.localStorage['user'];
                    var base64 = new Base64();
                    if (user_string) {
                        var user = JSON.parse(user_string);
                        if (user) {
                            config.headers['Authorization'] = 'Basic '+base64.encode(user.token+':');
                        }
                    }
                    return config;
                },

                responseError : function(response){
                    switch (response.status){
                        case 401 : $rootScope.$broadcast('unauthorized');break;
                        case 403 : $rootScope.$broadcast('forbidden');break;
                    }
                    return $q.reject(response);
                }
            }
    })
    .factory('Store', function($window){
        return{
            set : function(key, obj){
                $window.localStorage.setItem(key, obj);
                return $window.localStorage[key];
            },
            get : function(key){
                return $window.localStorage[key] ? $window.localStorage[key] : null;
            }
        }
    })
