/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.run(function($http, $rootScope, $timeout, $filter, $q, $sce, Global, $uibModal, modalUtils, News) {
	$rootScope.unauthorizedReq = [];
	$rootScope.$on('forbidden', function() {

	});
	$rootScope.$on('unauthorized', function() {
		if (Global.isLoggedIn()) {
			Global.updateData({
				isExpired: true
			})
			$timeout(function() {
				angular.element("#btn-2").click();
			})
		}
	});


	$rootScope.searchBar = {
		value: '',
		ele: function() {
			return angular.element("#searchBar")[0];
		},
		data: [],
		hide: true,
		toggleFold: function(news){
			news.fold = !news.fold;
		},
		clear: function(){
			this.value = '';
		}
	}

	var perPage = 10;
	var fetchNews = fetchNewsPage(1);

	function fetchNewsPage(startPage) {
		return function fetchClosure() {
			var deferred = $q.defer();
			News.query({
				page: startPage,
				per_page: perPage
			}, function(result) {
				++startPage;
				deferred.resolve(result.news);
			}, function() {
				fetchClosure();
			})
			return deferred.promise;
		}
	}

	function fetchRecursive() {
		var promise = fetchNews();
		var result = [];
		var deferred = $q.defer();
		promise.then(function(newsArr) {
			result = newsArr
			if (result.length != 0) {
				$rootScope.searchBar.data = $rootScope.searchBar.data.concat(result);
				deferred.resolve(fetchRecursive());
			} else {
				deferred.resolve($rootScope.searchBar.data);
				return deferred.promise;
			}
		})
		return deferred.promise;
	}
	window.addEventListener("keydown", function(e) {
		if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
			$rootScope.searchBar.ele().focus();
			e.preventDefault();
		}

	})

	$rootScope.searchFocused = function() {
		fetchRecursive().then(function(data) {
			$rootScope.searchResult = getFilteredResult($rootScope.searchBar.value);
		});
	}

	$rootScope.$watch('searchBar.value', function(newValue) {
		if (newValue.length == 0) {
			$rootScope.searchBar.hide = true;
		} else {
			$rootScope.searchBar.hide = false;
			var arr = getFilteredResult(newValue);
			angular.forEach(arr, function(result) {
				result.trustText = $sce.trustAsHtml(result.context);
				result.created = {};
				result.created.date = new Date().format('YY년 MM월 dd일', result.created_at);
				result.created.time = new Date().format('hh:mm', result.created_at);
				result.fold = true;
			});
			$q.all(arr).then(function() {
				$rootScope.searchResult = arr;
			})
		}
		console.log($rootScope.searchResult)
	})

	function getFilteredResult(input) {
		var output = $filter('filter')($rootScope.searchBar.data, function(value, index, array) {
			// if (removeEscapeChar(value.context).toLowerCase().indexOf(input.toLowerCase()) > -1) {
			var reg = new RegExp(input, "gi");
			if (removeEscapeChar(value.context).search(reg) != -1) {
				return true;
			}
		});
		return output;
	}

	function removeEscapeChar(value) {
		var str = value.replace(/(<([^>]+)>)/ig, "")
			.replace(/&nbsp;/gi, "")
			.replace(/&lt;/gi, "<")
			.replace(/&gt;/gi, ">")
			.replace(/&amp;/gi, "&")
			.replace(/&quot;/gi, '"');
		return str;
	}
})