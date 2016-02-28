'user strict';
var utilsModule = angular.module('utilsModule', ['ui.bootstrap.modal']);

utilsModule
.factory('modalUtils', [
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
])
.factory('popoverUtils',['$rootScope', 
    function($rootScope){
            var popover = new CustomPopover();
            popover.toggle =function($event, model){
                $event.stopPropagation();
                $event.preventDefault();

                if (model === popover.model) {
                    popover.visible = !popover.visible;
                } else {
                    if($rootScope.rootPopover){
                        $rootScope.rootPopover.visible = false;
                    }
                    popover.model = model;
                    popover.visible = true;
                }
                popover.event = $event;
                popover.x = $($event.currentTarget).offset().left + $($event.currentTarget).width();
                popover.y = $($event.currentTarget).offset().top + $($event.currentTarget).height();
                $rootScope.rootPopover = popover;
            }
        return popover;   
}])

function CustomPopover(){
                this.visible= false;
                this.x= 0;
                this.y= 0;
                this.model= null;
                this.event= null;
                
}
CustomPopover.prototype.set = function(obj){
    for(var i=0; i<Object.keys(obj).length; i++){
        if(this.hasOwnProperty(Object.keys(obj)[i])){
            this[Object.keys(obj)[i]] = obj[Object.keys(obj)[i]];
        }
    }
}
/*
CustomPopover.prototype.toggle = function($event, model){
    $event.stopPropagation();
                $event.preventDefault();

                if (model === this.model) {
                    this.visible = !this.visible;
                } else {
                    // if($rootScope.rootPopover){
                        // $rootScope.rootPopover.visible = false;
                    // }
                    this.model = model;
                    this.visible = true;
                }
                this.event = $event;
                this.x = $($event.currentTarget).offset().left + $($event.currentTarget).width();
                this.y = $($event.currentTarget).offset().top + $($event.currentTarget).height();
                // $rootScope.rootPopover = popover;
}*/