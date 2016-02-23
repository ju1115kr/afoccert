'use strict';

var app = angular.module('certApp');

app.
directive("sinPopover", function($compile,PopoverProvider, $rootScope, $timeout){
	function Popover(){
		this.triggered = false;
		this.options = {};
		this.ele = null;
		this.domEle = null;
	}
	Popover.prototype.toggleTrigger = function(value){
		if(value!==true && value !==false){
			this.triggered = !this.triggered;
		}else{
			this.triggered = value;
		}
	}
	return {
		restrict : "A",
		scope : {
			triggerFn: "&sinPopover"
		},
		link: function(scope, element, attrs){
			var _popover = scope.popover;
			_popover.ele = element;
			angular.element("body").click(function(event){
				if(!element[0].contains(event.target)){
					_popover.toggleTrigger(false);
					scope.$digest();
				}else{
					scope.triggerFn();
					if(!_popover.domEle){
						_popover.options = PopoverProvider.target;
						_popover.domEle = angular.element('<popover ng-if="popover.triggered" ctrl="'+_popover.options.controller+'" html="popover.options.templateUrl" position="popover.options.position" class="popover-container"></popover>');
						_popover.domEle.appendTo(element);
						$compile(_popover.domEle)(scope);
					}
					_popover.toggleTrigger();
					scope.$digest()
				}
			})
			
		},
		controller: function($scope, $rootScope, PopoverProvider){
			$scope.popover = new Popover();
			$rootScope.$on("popoverCloseAll",function(){
				$scope.popover.toggleTrigger(false);
			});
		}
	}
	
}).
directive("popover", function($timeout){
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
					case 'bottom' : $timeout(function(){scope.style = 'left : 50%;margin-left : ' + (-1)*popover.width()/2+'px';})
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
		open : function(data){
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