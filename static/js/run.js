/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.run(function($http, $rootScope, $timeout, $filter, $q, $sce, Global, $uibModal, $uibModalStack, modalUtils, News, Comments, Search, Blob, Processing) {

	CNote.prototype.getFile = function(){
		Blob.download(this);
	};

	$rootScope.unauthorizedReq = [];
	$rootScope.$on('forbidden', function() {

	});
	$rootScope.$on('unauthorized', function() {
		if (Global.isLoggedIn()) {
			Global.updateData({
				isExpired: true
			})
			$timeout(function() {
				if(angular.element("#btn-2").find('.popover').length==0){
					angular.element("#btn-2").click();
				}
			})
		}else{

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
			$uibModalStack.dismissAll();
			news.selected = true;
			this.selected = news;
			var modalInstance = $uibModal.open({
				templateUrl: '/partials/partial-news-modal.html',
				controller: 'ModalNewsCtrl',
				windowClass: 'enter-searchResult',
				appendTo: angular.element(".search-detail"),
				resolve: {
					modalNews: function () {
						return news;
					}
				}
			});
			var that = this;
			modalInstance.result.then(function(){
				news.selected = false;
				that.selected = null;
			}, function(){
				$rootScope.$broadcast('update:news',news.id); //broadcast to news directives
				news.selected = false;
				that.selected = null;
			})

		},
		clear: function(){
			this.value = '';
		},
		loading: true,
		selected: null,
		result: false
	}

	window.addEventListener("keydown", function(e) {
		if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
			$rootScope.searchBar.ele().focus();
			e.preventDefault();
		}
	});

	var timeout;
	var newsSize;

	function setDelay (){
		var page = 1;
		var per_page = 1000;
		function recursiveNewsSize(page){
			var newsSize = 0;
			return News.query({page:page, per_page: 20}).$promise
				.then(function(data){
					if(data.news.length!==0){
						newsSize = data.news[0].id;
					}else{
						newsSize = recursiveNewsSize(++page);
					}
					return newsSize;
				})
				.catch(function(err){
					return recursiveNewsSize(page);
				})
		}
		recursiveNewsSize(1)
			.then(function(value){
				newsSize = value;
				$rootScope.searchResult = [];
				timeout = setTimeout(function recursiveSearch(){
					Search.fromNews({page:page, keyword:$rootScope.searchBar.value, per_page:per_page}).$promise
						.then(function(result){
							var newses = [];
							result.forEach(function(news){
								newses.push(Processing.classification(news));
							})
							return newses;
						})
						.then(function(newses){
							$rootScope.searchResult = $rootScope.searchResult.concat(newses);
							page++;
							if(per_page*page > newsSize){
								$rootScope.searchBar.loading = false;
							}else{
								recursiveSearch();
							}
						})
				},500);
			})
	};
	function breakDelay (){
		$rootScope.searchBar.loading = true;
		clearTimeout(timeout);
	}

	$rootScope.$watch('searchBar.value', function(newValue) {
		if (newValue.length == 0) {
			$rootScope.searchBar.hide = true;
		} else {
			$rootScope.searchBar.hide = false;
			breakDelay();
			setDelay();
		}
	})

})
