'use strict';

var app = angular.module('certApp');

app.config(function($routeSegmentProvider, $routeProvider, $locationProvider, $animateProvider, $httpProvider) {

    // Configuring provider options

    $routeSegmentProvider.options.autoLoadTemplates = true;

    // Setting routes. This consists of two parts:
    // 1. `when` is similar to vanilla $route `when` but takes segment name instead of params hash
    // 2. traversing through segment tree to set it up

    $routeSegmentProvider

        .when('/', 'index')
        .when('/tab1', 'index.tab1')
        .when("/tab2", 'index.tab2')
        .when('/tab3', 'index.tab3')

    .segment('index', {
            templateUrl: '/partials/partial-index.html',
            controller: 'IndexCtrl'
        })
        .within()
        .segment('tab1', {
            templateUrl: '/partials/partial-tab1.html',
            controller: 'Tab1Ctrl'
        })
        .segment('tab2', {
            templateUrl: '/partials/partial-tab2.html',
            controller: 'Tab2Ctrl'
        })
        .segment('tab3', {
            templateUrl: '/partials/partial-tab2.html',
            controller: 'Tab3Ctrl'
        })
        .up()
    $routeProvider.otherwise({
        redirectTo: '/tab1'
    });
    // $locationProvider.html5Mode(true);

    $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);

    $httpProvider.interceptors.push('APIIntercepter');

});