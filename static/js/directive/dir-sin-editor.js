'use strict';

var app = angular.module('certApp');

app
	.directive("sinEditor", function($timeout, User, Groups, modalUtils, $uibModal, $q, $rootScope) {
		return {
			restrict: "E",
			scope: {
				entries: "=sinEntries",
				submit: "&sinSubmit",
				value: "=value",
				editorStyle: "@sinClass",
				autofocus: "=sinAutofocus",
				editorFocused: "&sinFocused",
				editorBlured: "&sinBlured",
				editorType: "@sinMode",
				groupFlag: "@sinGroup"
			},
			replace: true,
			controller: function($scope, $sce) {
				$scope.users = [];
				$scope.editor;
				$scope.hash = {
					ele: angular.element('<input ng-model="hash.typed" ng-trim="false" class="hash-input" ng-focus="hash.inCaret=true" ng-blur="hash.inCaret=false" autofocus="true" kr-input>'),
					typed: '',
					submit: false, //selected hash or false
					constructed: false,
					inCaret: false,
					hashing: false
				};
				var dummyCvtStringToSafeHtml = '<span class="fn-dummy-safe"></span>';
				var isEditing = $scope.value;
				initEditor();

				function initEditor() {
					var contents, style;

					if (isEditing) {
						contents = dummyCvtStringToSafeHtml + cvtHashSpanToInput($scope.value.text);
					} else {
						contents = dummyCvtStringToSafeHtml;
					}

					if (!$scope.editorStyle) {
						if ($scope.editorType) {
							style = 'sin-editor-' + $scope.editorType;
						} else {
							style = '';
						}
					} else {
						if ($scope.editorType) {
							style = $scope.editorStyle + ' sin-editor-' + $scope.editorType;
						} else {
							style = $scope.editorStyle;
						}
					}

					$scope.editor = {
						caret: {},
						blured: false,
						value: contents,
						style: style,
						file: {
							data : isEditing ? $scope.value.file : undefined,
							removed : false
						},
					};
				}

				$scope.pushEntry = function(htmlText) {
					if (!$scope.hash.constructed && !$scope.hash.hashing) {
						htmlText = htmlText.replace(dummyCvtStringToSafeHtml, '');
						var obj = {
							id: $scope.value ? $scope.value.id : undefined,
							text: cvtHashInputToSpan(htmlText),
							model: $scope.entries ? $scope.entries : undefined,
							files: { data : $scope.fileToUpload, origin: $scope.editor.file.data, removeOrigin : $scope.editor.file.removed },
							group: (!$scope.selectedPolicy || $scope.selectedPolicy.id===null) ? null : $scope.selectedPolicy.id
							/*
							 the key names (eg.'text') must sync with directive's
							 attirbute parameter of function 'submit'.
							 */
						};
						if (obj.text.length !== 0) {
							$scope.submit(obj);
							if (isEditing) {
								$scope.value.text = cvtHashInputToSpan(htmlText);
								$scope.value.trustText = $sce.trustAsHtml($scope.value.text);
								$scope.value.edit = false;
							} else {
								initEditor();
							}
							$scope.removeFile();
						}
					}
				};

				/**
				 * Convert Input hash to Span hash
				 * @param text
				 * @returns {*|string}
				 */
				function cvtHashInputToSpan(html){
					var ele = document.createElement('div');
					ele.innerHTML = html;
					var inputs = ele.getElementsByTagName('input');
					inputs = Array.prototype.slice.call(inputs);
					for(var i =0; i<inputs.length; i++){
						if(inputs[i].hasAttribute('refer')){
							var node = document.createElement('span');
							node.innerHTML = '@' + inputs[i].getAttribute('refer');
							node.setAttribute('class','hash-input');
							node.setAttribute('style', inputs[i].getAttribute('style'));
							inputs[i].parentNode.replaceChild(node, inputs[i]);
						}
					}
					return ele.innerHTML;
				};
				/**
				 * Convert Span hash to Input hash
				 * @param text
				 * @returns {*|string}
				 */
				function cvtHashSpanToInput(html){
					var ele = document.createElement('div');
					ele.innerHTML = html;
					var spans = ele.getElementsByTagName('span');
					spans = Array.prototype.slice.call(spans);
					for(var i =0; i<spans.length; i++){
						if(spans[i].hasAttribute('class') &&
							spans[i].getAttribute('class').split(' ').indexOf('hash-input')>-1){
							var node = document.createElement('input');
							node.setAttribute('class','hash-input readonly');
							node.setAttribute('readonly','');
							node.setAttribute('value',spans[i].innerHTML.split('@')[1].split(':')[0]);
							node.setAttribute('refer',spans[i].innerHTML.split('@')[1]);
							node.setAttribute('style', spans[i].getAttribute('style'));
							spans[i].parentNode.replaceChild(node, spans[i]);
						}
					}
					return ele.innerHTML;
				};

				$scope.undoEdit = function(){
					$scope.value.edit = false;
				};

				$scope.getFocus = function() {
					var obj = {
						model: $scope.entries ? $scope.entries : undefined
					};
					$scope.editorFocused(obj);
					$scope.isFocused = true;
				};

				$scope.loseFocus = function() {
					var obj = {
						model: $scope.entries ? $scope.entries : undefined
					};
					$scope.editorBlured(obj);
					$scope.isFocused = false;
				};

				$scope.uploadTest = function(files, file, newfiles, duplicatefiles, invalidfiles, event){
					invalidfiles.forEach(function(file){
						console.error(file.$error+' : '+file.$errorParam);
					});
					if(files){
						$scope.editor.file.removed = true;
					}
				};

				$scope.$watch('fileToUpload', function(newVal, oldVal){
					if(newVal && newVal.length>1){
						var recentItem = newVal[newVal.length-1];
						$scope.fileToUpload = [recentItem];
					}
				})

				$scope.$watch('editor.file.removed', function(newVal){
					if(newVal == false){
						$scope.removeFile();
					}
				});
				$scope.removeFile = function(){
					$scope.fileToUpload = [];
				};

				/**
				 * 공개 범위 관련 함수
				 */

				var defaultGroup = {
					id:null,
					name : '전체공개',
					selected: false
				};
				$scope.groupEnabled = function(){
					if($scope.groupFlag === true || $scope.groupFlag == 'true')
						return true;
					return false;
				}
				$scope.initGroupPolicies = function(){
					var selectPolicyDeferred = $q.defer();
					$scope.groupPolicies = [defaultGroup];
					if(isEditing){
						if($scope.value.group === null){
							selectPolicyDeferred.resolve($scope.groupPolicies[0])
						}else{
							Groups.query({groupId:$scope.value.group}, function(group){
								selectPolicyDeferred.resolve(group);
							});
						}
					}else{
						var username = JSON.parse(window.localStorage['user']).userId;
						User.get({userId:username}, function(data){
							if(data.recent_group === null){
								selectPolicyDeferred.resolve($scope.groupPolicies[0])
							}else{
								Groups.query({groupId:data.recent_group}, function(group){
									selectPolicyDeferred.resolve(group);
								});
							}
						})
					}
					selectPolicyDeferred.promise.then(function(selected){
						$scope.selectedPolicy = selected;
						$scope.fetchGroupPolicies();
					})
				};

				$rootScope.$on('update:user',function(){
					$scope.initGroupPolicies();
				})

				$scope.fetchGroupPolicies = function(){
					Groups.query(function(policies){
						defaultGroup = $scope.groupPolicies[0];
						$scope.groupPolicies = policies.groups;
						$scope.groupPolicies.unshift(defaultGroup);
						$scope.groupPolicies.forEach(function(p){
							if(p.id == $scope.selectedPolicy.id){
								p.selected = true;
							}else{
								p.selected = false;
							}
						})
					})
				};

				$scope.selectPolicy = function(policy){
					$scope.groupPolicies.forEach(function(p){
						if(p.id === policy.id){
							p.selected = true;
							$scope.selectedPolicy = p;
						}else{
							p.selected= false;
						}
					})
				};

				$scope.createGroupPolicy = function(){
					if(!modalUtils.modalsExist()) {
						var modalInstance = $uibModal.open({
							templateUrl: '/partials/partial-group-policy-modal.html',
							windowClass: 'aside info',
							backdropClass: 'aside',
							controller: 'ModalGroupPolicyCtrl',
						});
					};
				};
			},
			templateUrl: '/partials/partial-editor-body.html',
			link: function($scope, element, attrs) {

				var editor = element.find("#fn-note");
				editor.bind('keydown', 'alt+s', function(event) {
					$scope.pushEntry($scope.editor.value);
					event.preventDefault();
				})

			}
		};
	})
	.directive("sinNote", function($compile, $timeout, $sce) {
		return {
			restrict: "A",
			require: "ngModel",
			scope: {
				hash: "=sinHash",
				isFocused: "=sinFocused",
				isBlured: "=sinBlured",
			},
			controller: function($scope) {
				$scope.users = [];
			},
			link: function($scope, element, attrs, ngModel) {

				function read() {
					setTimeout(function() {
						ngModel.$setViewValue(element.html());
					}, 100)
				}
				ngModel.$render = function() {
					element.html(ngModel.$viewValue || "");
				};

				var
					hashInput,
					hashInputTyped,
					editor = element,
					hashIndicator = [{'name':'hash-refer','notation':'@'}],
					currHash;

				initHash();

				editor
					.bind("blur keyup change", function() {
						$scope.$apply(read);
						// $scope.$evalAsync(read)
					})
					.bind('keydown', 'shift+2', function(event) {
						if (!$scope.hash.constructed) {
							$scope.hash.hashType = currHash = hashIndicator[0];
							insertNodeAtCursor(hashInput.get(0));
							hashInput
								.autoGrowInput({
									minWidth: 10,
									comfortZone: 10
								}).focus();
							$scope.hash.constructed = true;
							$compile(hashInput)($scope);
						}
					});

				$scope.$watch('hash.typed', function(val) {
					if ($scope.hash.constructed) {
						if ($scope.hash.typed.length === 0) {
							$scope.finishHash();
						} else {
							if ($scope.hash.typed.charAt(0) !== currHash.notation) {
								$scope.finishHash();
							}
						}
					}
				});

				$scope.$watch('hash.inCaret', function(newValue, oldValue, scope) {
					if (!newValue) {
						$scope.finishHash();
					}
				});

				$scope.$watch('hash.submit', function(newValue) {
					if (newValue) {
						$scope.finishHash();
					}
				})

				$scope.$watch('isFocused', function(newValue) {
					$scope.finishHash();
				})

				$scope.finishHash = function() {
					if ($scope.hash.constructed && !$scope.hash.hashing) {
						$scope.hash.hashing = true; //start hashing process
						if (!$scope.hash.submit) {
							replaceHashWith($scope.hash.typed);
						} else {
							$scope.users.push($scope.hash.submit);
							var currHash = $scope.users[$scope.users.length-1];
							hashInputTyped = angular.element('<input' +
								' value="' + currHash.typed + '"'+
								' refer="'+ currHash.typed+':'+currHash.data.username+'"'+
								' class="hash-input readonly" readonly>');
							replaceHashWith(
								hashInputTyped,
								function() {
									hashInputTyped.autoGrowInput({
										minWidth: 10,
										comfortZone: 0
									});
									hashInputTyped.next('span').remove();
									hashInputTyped.next('span').remove();
								}
							); //end hash processing : internally, it perform initHash;
						}
					}
				};

				function initHash() {
					$scope.hash = {
						ele: angular.element('<input ng-model="hash.typed" ng-trim="false" class="hash-input" ng-focus="hash.inCaret=true" ng-blur="finishHash()" safe-auto-focus="true" kr-input>'),
						typed: '',
						submit: false,
						focus: false,
						inCaret: false,
						hashing: false,
					};
					hashInput = $scope.hash.ele;
					hashInput.bind('keydown', 'space esc', function(e) {
						$scope.finishHash();
						e.preventDefault();
					});
				};

				function replaceHashWith(ele, callback) {
					$timeout(function() {
						if (typeof ele.get !== 'function' &&
							typeof ele === 'string') { //if ele is string
							//							insertTextAtCursor(ele);
							hashInput.before(ele);
						} else if (typeof ele.get === 'function') {
							if (ele.get(0).nodeType === 1) { //if ele's nodetype is element
								insertNodeAtCursor(ele.get(0))
							}
						}
					}).then(function() {
						if (typeof callback !== 'undefined') {
							callback();
						}
						$timeout(function() {
							destroyHash();
							initHash();
						});
					});
				};

				function destroyHash() {
					hashInput.next('span').remove();
					hashInput = hashInput.detach();
					$scope.hash.constructed = false;
					$compile(hashInput)($scope);
					read();
				};
			}
		};
	})
	.directive("sinSubmitbtn", function() {
		return {
			restrict: "A",
			require: "^sinEditor",
			scope: true,
			controller: function($scope) {
				$scope.submitBtn = {
					class: ""
				}
				switch ($scope.editorType) {
					case 'default':
						$scope.submitBtn.class = "default";
						break;
					case 'hidden':
						console.log('hidden');
						break;
					case 'inline':
						console.log('inline');
						break;
				}
			}
		}
	})
	.directive("sinTypeahead", function($filter) {
		return {
			restrict: "A",
			scope: {
				hash: "=sinHash"
			},
			templateUrl: 'partials/partial-typeahead.html',
			controller: function($scope, $filter, HashList, $timeout) {
				HashList.get($scope.hash.hashType.notation).then(function(list){
					$timeout(function(){
						$scope.hashlist = list;
					})
				});
				$scope.focusIndex = 0;
				$scope.$watch('hash.typed', function(newValue) {
					if ($scope.hash.constructed) {
						if ($scope.hash.typed.length != 0) {
							$scope.filteredResult = $filter('filter')($scope.hashlist, {
								name: newValue.substring(1)
							});
							$scope.focusIndex = 0;
						} else {
							$scope.focusIndex = null;
						}
					}
				})
				$scope.cvtCurrentHash = function() {
					if ($scope.filteredResult.length != 0) {
						return {
							typed: $scope.filteredResult[$scope.focusIndex].name,
							data: $scope.filteredResult[$scope.focusIndex]
						}
					} else {
						return false;
					}
				}
				$scope.submitByClick = function(index, $event) {
					$scope.focusIndex = index;
					$event.preventDefault();
					$scope.hash.submit = $scope.cvtCurrentHash();
				};
				$scope.hoverIndex = function(index) {
					$scope.focusIndex = index;
				};

			},
			link: function($scope, element, attrs) {
				var hashInput = $scope.hash.ele;
				hashInput
					.bind('keydown', 'down', function(e) {
						$scope.focusIndex++;
						$scope.focusIndex %= $scope.filteredResult.length;
						$scope.$apply();
						e.preventDefault();
					})
					.bind('keydown', 'up', function(e) {
						$scope.focusIndex--;
						$scope.focusIndex += $scope.filteredResult.length;
						$scope.focusIndex %= $scope.filteredResult.length;
						$scope.$apply();
						e.preventDefault();
					})
					.bind('keydown', 'return', function(e) {
						$scope.hash.submit = $scope.cvtCurrentHash();
						e.preventDefault();
					});
			}
		}
	})
