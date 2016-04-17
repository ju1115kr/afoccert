'use strict';

angular.module('certApp')
    .controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $uibModal, News, $http, $window, Comments, Reply, $q, Store, modalUtils, $timeout, Global, PopoverProvider) {
                      
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

            /**
             * 뉴스 관련 함수
             */


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
            $scope.editNewsEnd = function (id, text) {
                $scope.popover.model.edit = false;
                News.update(
                    {newsId: id}, {'context': text, 'tags':[]},
                    function (data, stauts, headers, config) {

                    },
                    function (err) {
                        $scope.editNewsStart();
                    });
            }
 

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

            $scope.editNewsStart = function () {
                if(Global.user['userId']==$scope.popover.model.author){
                    $scope.popover.model.edit = true;
                }
            }


            /**
             *  comments
             */
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

            $scope.editCommentStart = function(comment){
                if(Global.user['userId']==comment.author){
                   comment.edit = true;
                }
            }

            $scope.editCommentEnd = function (id, comment) {
                Comments.update(
                    {commentId: id}, {context: comment},
                    function (data, stauts, headers, config) {
                    },
                    function (err) {
                    });
            }

            $scope.replyToCommentStart = function (comment){
                comment.replyDisplay = true;
                comment.replies =[];
                comment.replies.commentId = comment.id;
            }

            $scope.addReplyToComment = function(text, model){
                Reply.toComment({commentId: model.commentId}, {'context': text}, function(data, headers){
                    $http({method: 'GET', url:headers('Location')}).success(function(data){
                        serializer(data, 'context', 'text');
                        data.trustText = $sce.trustAsHtml(data.text);
                        data.recent = true;
                        model.push(data);
                    })
                })
            }

            $scope.deleteReply = function(reply){
                $scope.deleteComment(reply);
            }
            
            $scope.editReplyStart = function(reply){
                $scope.editCommentStart(reply);
            }

            $scope.editReplyEnd = function(id, reply){
                $scope.editCommentEnd(id, reply);
            }

            $scope.hasReply = function(comment){
                return comment.count_reply
            }

            $scope.showReplies = function(comment){
                comment.replyDisplay = true;
                Reply.fromComment({commentId: comment.id},function(data){
                    comment.replies = data.reply_comments;
                    angular.forEach(comment.replies, function (reply) {
                        serializer(reply, 'context', 'text');
                        reply.trustText = $sce.trustAsHtml(reply.text);                                
                    });
                    comment.replies.commentId = comment.id;
                })
            }
            /**
             *  Popover
             */

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

