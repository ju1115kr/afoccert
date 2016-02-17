'use strict';

angular.module('certApp')
    .controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $uibModal, News, $http, $window, Comments, $q, Store, modalUtils, $timeout, Global, PopoverProvider) {
            /**
             * prevent ctrl+f : find
             */
            window.addEventListener("keydown", function (e) {
                if (e.keyCode === 114 || (e.ctrlKey && e.keyCode === 70)) {
                    e.preventDefault();
                }
            })
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
            var fetchNewses = fetchNewPage(1);
            fetchNewses();
            $scope.$on('scrollBottom', function () {
                if(!$scope.fetching && !$scope.fetchedAll){
                    fetchNewses();
                }
            })

            $scope.editList = [];
            $scope.addNews = function (text, model) {
                var obj = {
                    text: text
                };
                
                News.save({'context': obj.text}, function (data, headers) {
                    $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                        data = processingNews(data);
                        model.unshift(data);
                    })
                })
            };
            $scope.editNewsEnd = function (id, text) {
                $scope.popover.model.edit = false;
                News.update(
                    {newsId: id}, {context: text},
                    function (data, stauts, headers, config) {

                    },
                    function (err) {
                        $scope.editNewsStart();
                    });
            }
            $scope.editCommentStart = function(comment){
                // $http({method: 'GET', url: comment.author}).success(function(data){
                    if(Global.user['userId']==comment.author){
                       comment.edit = true;
                    }
                // })
            }

            $scope.editCommentEnd = function (id, text) {
                Comments.update(
                    {commentId: id}, {context: text},
                    function (data, stauts, headers, config) {
                        console.log(data);
                    },
                    function (err) {
                    });
            }

            $scope.popover = {
                visible: false,
                x: 0,
                y: 0,
                model: null,
                event: null
            }

            $scope.popoverToggle = function ($event, news) {
                $event.stopPropagation();
                $event.preventDefault();
                $rootScope.rootPopover = $scope.popover;


                if (news == $scope.popover.model) {
                    $scope.popover.visible = !$scope.popover.visible;
                } else {
                    $scope.popover.model = news;
                    $scope.popover.visible = true;
                }
                $scope.popover.event = $event;
                $scope.popover.x = $($event.currentTarget).offset().left + $($event.currentTarget).width();
                $scope.popover.y = $($event.currentTarget).offset().top + $($event.currentTarget).height();
            }


            /**
             * delete news related functions
             * delete & undo
             */
            $scope.deleteNewsStart = function () {
                $scope.popover.visible = false;
                if(Global.user['userId']==$scope.popover.model.author){
                if(!$scope.deleteList){
                        $scope.deleteList = [];
                }
                (function() {
                    for (var i = 0; i < $scope.deleteList.length; i++) {
                        if ($scope.popover.model === $scope.deleteList[i]){
                            return;
                        }
                    }
                    if($scope.popover.model.author === JSON.parse(Store.get('user'))['userId']){
                        var obj ={
                            data : $scope.popover.model, 
                            text: $scope.popover.model.text, 
                            trustText : $sce.trustAsHtml($scope.popover.model.text)};
                        $scope.deleteList.push($scope.popover.model);
                    }
                })();
                if(!modalUtils.modalsExist() && $scope.deleteList.length!==0) {
                    var modalInstance = $uibModal.open({
                        templateUrl: '/partials/partial-delete-modal.html',
                        windowClass: 'aside',
                        backdropClass: 'aside',
                        controller: 'ModalDeleteCtrl',
                        resolve: {
                            news: function () {
                                return $scope.deleteList
                            }
                        }
                    })
                    modalInstance.result.then(function(){

                    },function(reason){
                        if('rollbackAll'){
                            $scope.deleteList = [];
                        }
                    })
                };
                }
            }
            $scope.deleteNewsUndo = function (news) {
                news.readyToDelete = false;
            }
            /**
             * edit news related function
             * edit & confirm & undo
             */

            $scope.editNewsStart = function () {
                if(Global.user['userId']==$scope.popover.model.author){
                    $scope.popover.model.edit = true;
                }
            }

            $scope.addComment = function (text, model) {
                Comments.toNews({newsId: model.newsId}, {'context': text}, function (data, headers) {
                    $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                        data.trustText = $sce.trustAsHtml(data.context);
                        serializer(data, 'context', 'text');
                        model.push(data);
                    })
                })
            }

            $scope.deleteComment = function (comment) {
                Comments.delete({commentId: comment.id}, function (data) {
                    comment.deleted = true;
                }, function (err) {
                    console.log(err);
                })
            }
            $scope.google = function(){
        PopoverProvider.open({
            controller : 'byeCtrl',
            position : 'bottom',
            templateUrl : '/partials/partial-push-popover.html'
        });
    }
        }
    )
    .controller('ModalDeleteCtrl', function ($scope, $uibModalInstance, news, News, Store) {
        $scope.deleteList = news;
        console.log(news)
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

