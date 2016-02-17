'user strict';
var utilsModule = angular.module('utilsModule', ['ui.bootstrap.modal']);

utilsModule.factory('modalUtils', [
    '$uibModalStack',
    function ($uibModalStack) {
        return {
            modalsExist: function () {
                return !!$uibModalStack.getTop();
            },
            closeAllModals: function () {
                $uibModalStack.dismissAll();
            }
        };
    }
]);