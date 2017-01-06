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
        .when('/tab1/detail/:id', 'index.tab1.detail')
        .when('/tab3', 'index.tab3')
        .when('/admin', 'index.admin')
        .when('/admin/tags', 'index.admin.tags')
        .when('/admin/groups', 'index.admin.groups')
        .when('/admin/users', 'index.admin.users')

    .segment('index', {
            templateUrl: '/partials/partial-index.html',
            controller: 'IndexCtrl'
        })
        .within()
        .segment('tab1', {
            templateUrl: '/partials/partial-tab1.html',
            controller: 'Tab1Ctrl'
        })
            .within()
            .segment('detail',{
                templateUrl: '/partials/partial-tab1-detail.html',
                dependencies:['id'],
                controller: 'Tab1DetailCtrl'
            })
            .up()
        .segment('tab3', {
            templateUrl: '/partials/partial-tab2.html',
            controller: 'Tab3Ctrl'
        })
        .segment('admin', {
            templateUrl: '/partials/admin/admin-layout.html',
            controller: 'AdminCtrl'
        })
            .within()
            .segment('tags',{
                templateUrl: 'partials/admin/admin-tags.html',
                controller: 'TagsCtrl'
            })
            .segment('groups',{
                templateUrl: 'partials/admin/admin-groups.html',
                controller: 'GroupsCtrl'
            })
            .segment('userss',{
                templateUrl: 'partials/admin/admin-groups.html'
            })
            .up()
        .up()
    $routeProvider.otherwise({
        redirectTo: '/tab1'
    });
    // $locationProvider.html5Mode(true);

    $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);

    $httpProvider.interceptors.push('APIIntercepter');

});
