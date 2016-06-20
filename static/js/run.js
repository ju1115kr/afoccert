/**
 * Created by cert on 2016-01-26.
 */
'use strict';

var app = angular.module('certApp');

app.run(function($http, $rootScope, $timeout, $filter, $q, $sce, Global, $uibModal, $uibModalStack, modalUtils, News, Comments, Search) {
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

	function fetchComment(newses){
		var deferred = $q.defer();
        angular.forEach(newses, function(news, index){
            Comments.fromNews({newsId: news.id}, function (result) {
                news.comments = result;
                news.fetchingComment = false;
                news.comments.newsId = news.id;
            }, function(){

			})
        })
		$q.all(newses).then(function(){
			deferred.resolve(newses);
		});
		return deferred.promise;
    }
	window.addEventListener("keydown", function(e) {
		if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
			$rootScope.searchBar.ele().focus();
			e.preventDefault();
		}
	})

	var timeout;
	function setDelay (){
		timeout = setTimeout(function(){
			Search.fromNews({keyword:$rootScope.searchBar.value}, function(result){
				$rootScope.searchBar.loading = false;
				fetchComment(result).then(function(newses){
					$rootScope.searchResult = newses;
				})

			})
		},500);
	};
	function breakDeay (){
		$rootScope.searchBar.loading = true;
		clearTimeout(timeout);
	}

	$rootScope.$watch('searchBar.value', function(newValue) {
		if (newValue.length == 0) {
			$rootScope.searchBar.hide = true;
		} else {
			$rootScope.searchBar.hide = false;
			breakDeay();
			setDelay();
		}
	})

})
