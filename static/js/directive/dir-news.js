'use strict';

var app = angular.module('certApp');

app.directive('news', function(){
  return{
    restrict: "E",
    scope:{
      news:"=model"
    },
    templateUrl: '/partials/partial-news.html',
    controller: function($scope, $rootScope, $http, $sce, $uibModal, News, Comments, Reply, Global, Store, modalUtils, PopoverTrigger){
      /**
      * 뉴스 관련 함수
      */
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
      $scope.news.showPopover = function(){
        PopoverTrigger({
            controller : 'userInfoCtrl',
            position : 'top',
            templateUrl : '/partials/partial-userinfo-popover.html'
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
          $scope.popover.x = $($event.currentTarget).position().left+$($event.currentTarget).width();
          $scope.popover.y = $($event.currentTarget).position().top+$($event.currentTarget).height();
      }
    },
    link: function($scope, element, attrs){

    }
  }
})
