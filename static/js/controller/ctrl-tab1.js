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
                    var tempNews;
                    News.query(
                        {page: startPage, per_page: 20},
                        function (result) {
                            tempNews = result.news;
                            if(tempNews.length!==0){
                            angular.forEach(tempNews, function (news, index) {
                                news = processingNews(news);
                                Comments.fromNews({newsId: news.id}, function (result) {
                                    var commentArr = result.comments;
                                    angular.forEach(commentArr, function (comment) {
                                        serializer(comment, 'context', 'text');
                                        comment.trustText = $sce.trustAsHtml(comment.text);

                                    });
                                    $q.all(commentArr).then(function () {
                                        news.comments = commentArr;
                                        news.comments.newsId = news.id;
                                    })
                                })
                            })
                            }else{
                                $scope.fetchedAll = true;
                            }
                            if (tempNews) {
                                $scope.newses = $scope.newses.concat(tempNews);
                                $scope.fetching = false;
                                startPage++;
                            }
                        }, function (err) {
                    });
                }
            }

            function asyncNews(startPage, per_page){
                var deferred = $q.defer();
                News.query({page:startPage, per_page:per_page},function(newses){
                    deferred.resolve(newses);
                })
                return deferred.promise;
            }
            function asyncComment(newsID){
                var deferred = $q.defer();
                Comments.fromNews({newsId:newsID}, function(comments){
                    deferred.resolve(comments);
                })
                return deferred.promise;
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
    .controller('ModalDeleteCtrl', function ($scope, $uibModalInstance, news, News, Store) {
        $scope.deleteList = news;
        $scope.delete = function (item) {
            News.delete({newsId: item.id}, function () {
                item.deleted = true;
            });
        }
        $scope.deleteAll = function(){
            angular.forEach($scope.deleteList, function(item){
                $scope.delete(item);
                $uibModalInstance.close();
            })
        }
        $scope.rollbackAll = function(){
            $uibModalInstance.dismiss('rollbackAll');
        }
    });
