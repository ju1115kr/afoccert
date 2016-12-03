'use strict';

var app = angular.module('certApp');

app
    .directive('attachment', function(Processing, $uibModal, $uibModalStack, Comments){
        return {
            restrict : "E",
            replace: true,
            transclude: true,
            scope:{
                attachData:"="
            },
            templateUrl: '/partials/partial-attachment.html',
            controller : function($scope){
                $scope.attachment = Processing.news($scope.attachData);
                var news = $scope.attachment;
                Comments.fromNews({newsId: news.id}, function (result) {
                    var comments = [];
                    result.forEach(function(comment){
                        comments.push(Processing.comment(comment));
                    });
                    news.comments = comments;
                    news.comments.newsId = news.id;
                })
                $scope.fetchComment = function(){
                };
                $scope.viewDetail = function(){
                    $uibModalStack.dismissAll();
                    var modalInstance = $uibModal.open({
                        templateUrl: '/partials/partial-news-modal.html',
                        controller: 'ModalNewsCtrl',
                        windowClass: 'enter-searchResult',
                        resolve: {
                            modalNews: function () {
                                return $scope.attachment;
                            }
                        }
                    });
                }
            },
            link: function(scope, elem, attr){

            }
        }
    })/**
 * Created by cert on 2016-12-02.
 */
