'use strict';
var app = angular.module('certApp');

app.controller('AdminCtrl', function($scope, RouteLinkProvider) {
	$scope.link_provider = RouteLinkProvider;
	$scope.root = 'admin';
	$scope.section = 'index'+'.'+$scope.root;
	$scope.navBtn = [{
		name: '태그',
		link: 'tags',
		icon: 'glyphicons glyphicons-tag'
	}, {
		name: '그룹',
		link: 'groups',
		icon: 'glyphicons glyphicons-group'
	},{
		name: '사용자',
		link: 'users',
		icon: 'glyphicons glyphicons-user'
	}];
})