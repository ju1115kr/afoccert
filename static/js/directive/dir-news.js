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
        controller: function($scope, $rootScope, $http, $sce, $uibModal, News, Comments, Reply, Global, Store, modalUtils, PopoverTrigger, deleteList){
            /**
            * 뉴스 관련 함수
            */
            $scope.news.optionEnabled = ($scope.news.author==Global.user.userId);

            $scope.editNewsEnd = function (id, text) {
                $scope.news.edit = false;
                News.update(
                    {newsId: id}, {'context': text, 'tags':[]},
                    function (data, stauts, headers, config) {
                    },
                    function (err) {
                        $scope.editNewsStart();
                    }
                );
            }
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
            },
            link: function($scope, element, attrs){

            }
        }
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
