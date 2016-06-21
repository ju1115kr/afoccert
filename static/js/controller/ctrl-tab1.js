'use strict';

angular.module('certApp')

.controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $uibModal, News, $http, $window, Comments, Reply, $q, Store, modalUtils, $timeout, Global, Tags) {
    $scope.newses = [];
    $scope.fetching = false;
    $scope.fetchedAll = false;
    function processingNews(news){
        news.trustText = $sce.trustAsHtml(news.context);
        serializer(news, 'context', 'text');
        news.created = {};
        news.created.date = new Date().format('YY년 MM월 dd일', news.created_at);
        news.created.time = new Date().format('hh:mm', news.created_at);
        news.comments = [];
        news.comments.newsId = news.id;
        return news;
    };
    function fetchNewPage(startPage) {
        return function () {
            $scope.fetching = true;
            var newsDeferred = $q.defer();
            News.query(
                {page: startPage, per_page: 20},
                function (result) {
                    $scope.newses = $scope.newses.concat(result);
                    newsDeferred.resolve(result);
                    $scope.fetching = false;
                    startPage++;
                }
            );
            newsDeferred.promise.then(function(newses){
                if(newses.length==0){
                    $scope.fetchedAll = true;
                }else{
                    fetchComment(newses);
                }
            });
        }
    }

    function fetchComment(newses){
        angular.forEach(newses, function(news, index){
            Comments.fromNews({newsId: news.id}, function (result) {
                news.comments = result;
                news.fetchingComment = false;
                news.comments.newsId = news.id;
            })
        })
    }

    var fetchNewses = fetchNewPage(1);
    fetchNewses();

    $scope.$on('scrollBottom', function () {
        if(!$scope.fetching && !$scope.fetchedAll){
            fetchNewses();
        }
    })

    $scope.addNews = function (text, model) {
        var obj = {
            text: text
        };
        News.save({'context': obj.text, 'tags':[]}, function (data, headers) {
            $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                data = processingNews(data);
                model.unshift(data);
            })
        })
    };

}
)
.controller('ModalDeleteCtrl', function ($scope, $uibModalInstance, News, deleteList, $q) {
    $scope.deleteList = deleteList.get();
    $scope.delete = function (item) {
        News.delete({newsId: item.id}, function () {
            item.deleted = true;
            deleteList.clear(item);
            if($scope.deleteList.length==0){
                $uibModalInstance.close();
            }
        });
    }
    $scope.deleteAll = function(){
        angular.forEach($scope.deleteList, function(item){
            $scope.delete(item);
        })
        $q.all($scope.deleteList, function(){
            $uibModalInstance.close();
        })
    }
    $scope.rollbackAll = function(){
        deleteList.clearAll();
        $uibModalInstance.dismiss('rollbackAll');
    }
})
.factory("deleteList", function(){
    var list = {
        value:[],
        add: function(value){
            for (var i = 0; i < this.value.length; i++) {
                if (value === this.value[i]){
                    return;
                }
            }
            this.value.push(value);
        },
        get: function(){
            return this.value;
        },
        clear: function(value){
            for (var i = 0; i < this.value.length; i++) {
                if (value === this.value[i]){
                    this.value.splice(i,1);
                }
            }
        },
        clearAll: function(){
            this.value = [];
        }
    };
    return list;
});
