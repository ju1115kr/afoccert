'use strict';

var app = angular.module('certApp');

app
	.directive("sinPopover", function($compile, PopoverTrigger, popoverPromise, $rootScope, $timeout, $q, PopoverStack){
		function Popover(popoverInstance){
			this.triggered = false;
			// this.options = {};
			this.instance = popoverInstance;
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
				element.css({'display':'inline-block'})
				var deferred = $q.defer();
				if(!scope.popover){
					scope.triggerFn(); //set popoverPromise with options defined in triggerFn.
					popoverPromise.get().then(function(popoverInstance){
						popoverInstance.close = function(message){
							popoverInstance.closeDeferred.resolve(message);
							scope.popover.toggleTrigger(false);
						};
						popoverInstance.element = angular.element('<popover ng-if="popover.triggered" instance="popoverInstance" class="popover-container {{popoverInstance.options.position}}"></popover>');
						scope.popoverInstance = popoverInstance;
						if(!scope.popover){
							scope.popover = new Popover(popoverInstance);
						}else{
							scope.popover.instance = popoverInstance;
						}
						deferred.resolve(scope.popover);
					});
				} else {
					deferred.resolve(scope.popover);
				}
				angular.element("body").click(function(event){
					deferred.promise.then(function(popover){
						var _popoverObj = popover;
						if(!element[0].contains(event.target)){
							_popoverObj.toggleTrigger(false);
						}else{
							_popoverObj.toggleTrigger();
							if(!_popoverObj.appended){
								if(_popoverObj.instance.options.position.indexOf('top')>-1){
									_popoverObj.instance.element.prependTo(element);
								}else{
									_popoverObj.instance.element.appendTo(element);
								}
								_popoverObj.appended = true;
								$compile(_popoverObj.instance.element)(scope);
							}
						}
					});
				});
			},
		}
	})
	.directive("popover", function($timeout, $controller, $compile, $rootScope){
		return{
			scope: {
				instance: '=instance'
			},
			template : '<div class="popover" style="{{style}}"><div class="arrow"></div></div>',
			link: function(scope, element, attrs){
				element.bind("click",function(event){
					event.stopPropagation();
				})
				var popover = element.find(".popover");
				var tmpl = angular.element('<div class="popover-tmpl">'+scope.instance.tmpl+'</div>');
				tmpl.appendTo(popover);
				var offsetX = tmpl[0].clientWidth;
				var offsetY = tmpl[0].clientHeight;
				scope.instance.scope = (scope.instance.options.scope || $rootScope).$new();
				if(scope.instance.options.controller){
					var ctrlLocals = {};
					ctrlLocals.$scope = scope.instance.scope;
					ctrlLocals.$popoverInstance = scope.instance;

					var i = 0;
					angular.forEach(scope.instance.options.resolve, function(value,key){
						ctrlLocals[key] = scope.instance.vars[i++];
					})
					scope.instance.ctrlInstance = $controller(scope.instance.options.controller, ctrlLocals);
				}
				$compile(tmpl)(scope.instance.scope);
			}
		}
	})
	.factory("popoverPromise", function(PopoverStack){
		var promise = {
			value:null,
			set: function(value){
				this.value = value
			},
			get: function(){
				return this.value;
			},
		};
		return promise;
	})
	.factory("PopoverTrigger", function($compile, $rootScope, $controller, $q, $http, $templateCache, $injector, popoverPromise){

		function createPopover(options){
			if (!options.template && !options.templateUrl){
				throw new Error('Either templateUrl or template options should be specified');
			}
			function getTemplate(){
				return options.template ? $q.when(options.template) :
					$http.get(options.templateUrl, {
						cache : $templateCache
					}).then(function(result){
						return result.data;
					});
			}
			function getResolves(resolves){
				var promisesArr = [];
				angular.forEach(resolves, function(value) {
					if(angular.isFunction(value) ||
						(angular.isArray(value) && angular.isFunction(value[value.length - 1]))) {
						promisesArr.push($q.when($injector.invoke(value)));
					}else{
						promisesArr.push($q.when(value));
					}
				});
				return promisesArr;
			}

			var a = $q.defer();
			var instancePromise = $q.all(
				{
					options: options,
					tmpl: getTemplate(),
					vars: $q.all(getResolves(options.resolve || {})),
					closeDeferred: a,
				}
			);

			popoverPromise.set(instancePromise);
			return a.promise;

		}
		return createPopover;
	})
	.factory("PopoverStack", function(){
		var stack = [];
		return {
			save : function(_popoverPromise){
				stack.push(_popoverPromise);
			},
			get : function(){
				return stack;
			}
		}
	})
