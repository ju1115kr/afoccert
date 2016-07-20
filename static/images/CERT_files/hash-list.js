'use strict';

var app = angular.module('certApp');

app.factory('HashList', function() {
	return {
		get: function(){
			return [
			{name:'정진혁'},
			{name:'이상주'},
			{name:'신규현'},
			{name:'성연복'},
			{name:'정성민'},
			{name:'이주석'},
			{name:'이주영'},
			{name:'차현탁'}
			];
		}
	}
});
