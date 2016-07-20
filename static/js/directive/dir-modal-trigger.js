'use strict';

var app = angular.module('certApp');

app
.controller('popoverCtrl', MyModalController)
.directive('modalTrigger',modalTriggerDirective)
.factory('$myModal', myModalFactory);

function MyModalController($scope, $uibModalInstance, title) {
  $scope.title = title;
  $scope.confirm = $uibModalInstance.close;
  $scope.cancel = $uibModalInstance.dismiss;
};

function modalTriggerDirective($myModal) {
  function postLink(scope, iElement, iAttrs) {
    var modalInstance;
    function onClick() {
      modalInstance = $myModal.open(obj);
    }
  }
  return postLink;
}

function myModalFactory($uibModal) {
  var open = function(resolveObj){
    controller: 'MyModalController',
    templateUrl: 'partials/customModal.html',
    size: 'lg',
    resolve : resolveObj
  }
  return {
    open:open
  }
}


$scope.popUserInfo = function(){
  
}
