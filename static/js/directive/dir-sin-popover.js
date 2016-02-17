'use strict';

var app = angular.module('certApp');

app.
directive("sinPopover", function($compile,PopoverProvider, $rootScope){
	return {
		restrict : "A",
		scope : {
			triggerFn: "&sinPopover"
		},
		link: function(scope, element, attrs){
			scope.triggered = false;
			var popover;
			element.bind("click",function(event){
				scope.triggerFn();
				var isOpened = scope.triggered;
				scope.$apply(function(){
					scope.triggered = isOpened ? false : true;
				})
				if(!scope.triggered){
					PopoverProvider.close();
				}else{
					PopoverProvider.element = element;
				}
				if(!popover){
					scope.data = PopoverProvider.target;
					popover = angular.element('<popover ng-if="triggered" ctrl="'+scope.data.controller+'" html="data.templateUrl" position="data.position" class="popover-container"></popover>');
					popover.appendTo(element);
					$compile(popover)(scope);
				}
			});
			$rootScope.$on("popoverCloseAll",function(){
				console.log(PopoverProvider.element==element);
				
				if(PopoverProvider.element!=element){
					scope.$apply(function(){
							scope.triggered = false;
					})
				}else{
					if(!element[0].contains(PopoverProvider.ev.originalEvent.target)){
					//element 기준 popover 바깥을 누른경우
					console.log('dd')
						scope.$apply(function(){
							scope.triggered = false;
						})
						PopoverProvider.close();
					}
				}
			})



			angular.element("body").click(function(event){
					PopoverProvider.ev = event;
					PopoverProvider.closeAll();
			})
			
		},
		controller: function($scope, $rootScope, PopoverProvider){
		}
	}
	
}).
directive("popover", function(){
	return{
		scope: {
			inner : '=html',
			position : '=position'
		},
		template : '<div class="popover {{position}}" style="{{style}}"><div class="arrow"></div><div ng-include="inner" onload="loaded()"></div></div>',
		controller : '@',
		name : 'ctrl',
		link: function(scope, element, attrs){
			element.bind("click",function(event){
					event.stopPropagation();
			})
			scope.loaded = function(){
				var popover = element.find(".popover");
				switch(scope.position){
					case 'bottom' : scope.style = 'left : 50%;margin-left : ' + (-1)*popover.width()/2+'px';
				}
			}
		}
	}
}).
factory("PopoverProvider", function($rootScope){
	return{
		target :{},
		element : null,
		ev : null,
		open :function(data){
			this.target = data;
			if(this.target.resolve){
				var keys = Object.keys(this.target.resolve);
				for(var i=0; i<keys.length; i++){
					makeService(app, keys[i], this.target[keys[i]]);
				}
			}
		},
		close : function(){
			this.target = {};
			this.element = null;
		},
		closeAll : function(){
			$rootScope.$broadcast("popoverCloseAll");
		}
	}
});


function makeService(module, identifier, obj){
	module.factory(identifier,function(){
		return obj();
	})
}

function Popover (html, controller, resolved, position){
	this.html = html;
	this.controller = controller;
	this.resolved = resolved;
	this.position = position;
}
Popover.prototype.getDirective = function(){
	return '<popover html="'+this.html+'" ctrl="'+this.controller+'" resolved="'+this.resolved+'" position="'+this.position+'"></popover>'
}
Popover.prototype.appendTo = function(ele){
	if(ele instanceof jQuery){
		angular.element(this.getDirective()).appendTo(ele);
	}
}