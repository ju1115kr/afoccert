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
	function setDelay (){
		timeout = setTimeout(function(){
			Search.fromNews({keyword:$rootScope.searchBar.value}, function(result){
				var newses = [];
				result.forEach(function(news){
					newses.push(Processing.news(news));
				})
				$rootScope.searchResult = newses;
				$rootScope.searchBar.loading = false;
			})
		},500);
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
