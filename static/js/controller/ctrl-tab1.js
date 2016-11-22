'use strict';

angular.module('certApp')

.controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $uibModal, News, $http, $window, Comments, Reply, $q, Blob) {
    $scope.newses = [];
    $scope.fetching = false;
    $scope.fetchedAll = false;
    function processingNews(news){
        var newsInstance = new CNews(news);
        newsInstance.trustText = $sce.trustAsHtml(newsInstance.text);
        newsInstance.comments = [];
        newsInstance.comments.newsId = news.id;
        return newsInstance;
    };
    function fetchNewPage(startPage) {
        return function () {
            $scope.fetching = true;
            var newsDeferred = $q.defer();
            News.query(
                {page: startPage, per_page: 20},
                function (result) {
                    var newses = [];
                    result.forEach(function(news){
                        newses.push(processingNews(news));
                    })
                    $scope.newses = $scope.newses.concat(newses);
                    newsDeferred.resolve(newses);
                    $scope.fetching = false;
                    startPage++;
                }
            );
            newsDeferred.promise.then(function(newses){
                if(newses.length==0){
                    $scope.fetchedAll = true;
                }
            });
        }
    }

    var fetchNewses = fetchNewPage(1);
    fetchNewses();

    $scope.$on('scrollBottom', function () {
        if(!$scope.fetching && !$scope.fetchedAll){
            fetchNewses();
        }
    })

    $scope.addNews = function (text, model, files) {
        News.save({'context': text, 'tags':[]}, function (data, headers) {
            var newsDeferred = $q.defer();
            $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                newsDeferred.resolve(data);
            });
            newsDeferred.promise.then(function(unprocessedNews){
                var news = processingNews(unprocessedNews);
                if(files.data && files.data.length!==0) {
                    var file = {
                        file: files.data[0]
                    };
                    Blob.upload(news, file).then(function(fileAttachedNews){
                        news.update(fileAttachedNews);
                        model.unshift(news);
                    })
                }else{
                    model.unshift(news);
                }
            })
        })
    };

}
)
.controller('ModalDeleteCtrl', function ($scope, $uibModalInstance, News, deleteList, $q) {
    $scope.deleteList = deleteList.get();
    $scope.delete = function (item) {
        deleteList.clear(item);
        if($scope.deleteList.length == 0){
            $uibModalInstance.close();
        }
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
