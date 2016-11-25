'use strict';

var app = angular.module('certApp');

app
    .directive('news', function(){
        return{
            restrict: "E",
            scope:{
                news:"=model"
            },
            templateUrl: '/partials/partial-news.html',
            controller: function($scope, $rootScope, $http, $sce, $uibModal, $q, News, Comments, Reply, Global, Store, modalUtils, PopoverTrigger, deleteList, Upload, Blob, Processing){
                /**
                 * 뉴스 관련 함수
                 */
                //passed from run : dismiss modal from search view
                $rootScope.$on('update:news', function(e,newsId){
                    if(newsId == $scope.news.id){
                        News.query({'newsId':newsId}, function(n){
                            $scope.news = Processing.news(n);
                            $scope.fetchComment();
                        })
                    }
                })

                $scope.news.optionEnabled = ($scope.news.author==Global.user.userId);
                $scope.editNewsEnd = function (id, text, files, group) {
                    $scope.news.edit = false;
                    News.update({newsId:id},{'context': text, 'tags':[], 'group':group}, function (data, headers) {
                        if(files.origin && files.removeOrigin){
                            News.deleteFile({
                                newsId: id
                            }, function(unprocessedNews){
                                $scope.news.file = null;
                            })
                        }
                        if(files.data && files.data.length!==0) {
                            var file = {
                                file: files.data[0]
                            };
                            Blob.upload($scope.news, file).then(function(fileAttachedNews){
                                $scope.news.update(fileAttachedNews);
                            })
                        }else{
                            $scope.news.update(data);
                        }
                    }, function(err){
                        $scope.editNewsStart();
                    })
                };
                $scope.news.showPopover = function(){
                    PopoverTrigger({
                        controller : 'newsOptionsCtrl',
                        position : 'bottom-left',
                        templateUrl : '/partials/partial-news-options-popover.html',
                        resolve : {
                            news : function(){
                                return $scope.news;
                            },
                            deleteFn : function(){
                                return $scope.deleteNewsStart;
                            },
                            editFn : function(){
                                return $scope.editNewsStart;
                            }
                        }
                    }).then(function(){
                    })
                }
                $scope.deleteNewsStart = function (news) {
                    deleteList.add(news);
                    if(!modalUtils.modalsExist() && deleteList.get().length!==0) {
                        var modalInstance = $uibModal.open({
                            templateUrl: '/partials/partial-delete-modal.html',
                            windowClass: 'aside',
                            backdropClass: 'aside',
                            controller: 'ModalDeleteCtrl',
                        });
                    };
                }

                $scope.deleteNewsUndo = function (news) {
                    news.readyToDelete = false;
                }

                $scope.editNewsStart = function (news) {
                    if(news.author==Global.user.userId){
                        news.edit = true;
                    }
                }

                /**
                 *  comments
                 */

                $scope.fetchComment = function(){
                    var news = $scope.news;
                    Comments.fromNews({newsId: news.id}, function (result) {
                        var comments = [];
                        result.forEach(function(comment){
                            comments.push(Processing.comment(comment));
                        });
                        news.comments = comments;
                        news.fetchingComment = false;
                        news.comments.newsId = news.id;
                    })
                };
                $scope.addComment = function (text, model, files) {
                    Comments.toNews({newsId: model.newsId}, {'context': text}, function (data, headers) {
                        var commentDeferred = $q.defer();
                        $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                            commentDeferred.resolve(data);
                        });
                        commentDeferred.promise.then(function(unprocessedComment){
                            var comment = Processing.comment(unprocessedComment);
                            if(files.data && files.data.length!==0) {
                                var file = {
                                    file: files.data[0]
                                };
                                Blob.upload(comment, file).then(function(fileAttachedComment){
                                    comment.update(fileAttachedComment);
                                    model.push(comment);
                                })
                            }else{
                                model.push(comment);
                            }
                        })
                    })
                };

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

                $scope.editCommentEnd = function (id, text, files, model) {
                    var comment = (function(){
                        for(var i =0; i<model.length; i++){
                            if(model[i].id === id)
                                return model[i];
                        }
                    })();
                    Comments.update({commentId:id},{'context': text}, function (data, headers) {
                        if(files.origin && files.removeOrigin){
                            Comments.deleteFile({
                                commentId: id
                            }, function(){
                                comment.file = null;
                            })
                        }
                        if(files.data && files.data.length!==0) {
                            var file = {
                                file: files.data[0]
                            };
                            Blob.upload(comment, file).then(function(fileAttachedComment){
                                comment.update(fileAttachedComment);
                            })
                        }else{
                            comment.update(data);
                        }
                    }, function(err){
                        $scope.editCommentStart();
                    })
                }

                $scope.replyToCommentStart = function (comment){
                    comment.replyDisplay = true;
                    comment.replies = comment.replies || [];
                    comment.replies.commentId = comment.id;
                }

                $scope.addReplyToComment = function(text, model, files){
                    Reply.toComment({commentId: model.commentId}, {'context': text}, function (data, headers) {
                        var replyDeferred = $q.defer();
                        $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                            replyDeferred.resolve(data);
                        });
                        replyDeferred.promise.then(function(unprocessedReply){
                            var reply = Processing.reply(unprocessedReply);
                            reply.recent = true;
                            if(files.data && files.data.length!==0) {
                                var file = {
                                    file: files.data[0]
                                };
                                Blob.upload(reply, file).then(function(fileAttachedReply){
                                    reply.update(fileAttachedReply);
                                    model.push(reply);
                                })
                            }else{
                                model.push(reply);
                            }
                        })
                    });
                }

                $scope.deleteReply = function(reply){
                    $scope.deleteComment(reply);
                }

                $scope.editReplyStart = function(reply){
                    $scope.editCommentStart(reply);
                }

                $scope.editReplyEnd = function(id, text, files, model){
                    $scope.editCommentEnd(id, text, files, model);
                }

                $scope.hasReply = function(comment){
                    return comment.count_reply
                }

                $scope.showReplies = function(comment){
                    $scope.replyToCommentStart(comment);
                    Reply.fromComment({commentId: comment.id},function(data){
                        angular.forEach(data.reply_comments, function (reply) {
                            comment.replies.push(Processing.reply(reply));
                        });
                        $q.all(comment.replies, function(){
                            comment.replies.commentId = comment.id;
                        })
                    })
                };

                $scope.optionsFromUser = function(name){
                    PopoverTrigger({
                        controller : 'userOptionsCtrl',
                        position : 'bottom-left',
                        templateUrl : '/partials/partial-user-options-popover.html',
                        resolve : {
                            name : function(){
                                return name;
                            }
                        }
                    }).then(function(){
                    })
                }
            },
            link: function($scope, element, attrs){

            }
        }
    })
    .controller("userOptionsCtrl", function($scope, $popoverInstance, name){
        $scope.name = name;
        $scope.options = [
            {
                name:'신송조회',
                triggerFn : function(){
                }
            }
        ]
    })
    .controller("newsOptionsCtrl", function($scope, $popoverInstance, news, deleteFn, editFn){
        $scope.options = [
            {
                name:'수정',
                triggerFn : function(){
                    editFn(news);
                    $popoverInstance.close();
                }
            },
            {
                name:'삭제',
                triggerFn : function(){
                    deleteFn(news);
                    $popoverInstance.close();
                }
            }
        ]
    })
