'use strict';

var app = angular.module('certApp');

app.controller('ModalNewsCtrl', function($scope, modalNews){
  $scope.news = modalNews;
})
