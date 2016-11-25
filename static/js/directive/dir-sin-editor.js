'use strict';

var app = angular.module('certApp');

app
	.directive("sinEditor", function($timeout, Groups, modalUtils, $uibModal) {
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
				editorType: "@sinMode"
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
						contents = dummyCvtStringToSafeHtml + $scope.value.text;
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
							text: htmlText,
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
								$scope.value.text = htmlText;
								$scope.value.trustText = $sce.trustAsHtml(htmlText);
								$scope.value.edit = false;
							} else {
								initEditor();
							}
							$scope.removeFile();
						}
					}
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
				}
				$scope.initGroupPolicies = function(){
					$scope.groupPolicies = [defaultGroup];
					if(isEditing){
						if($scope.value.group === null){
							$scope.selectedPolicy = $scope.groupPolicies[0];
						}else{
							Groups.query({groupId:$scope.value.group}, function(group){
								$scope.selectedPolicy = group;
							});
						}
					}else{
						$scope.selectedPolicy = $scope.groupPolicies[0];
					}
					$scope.fetchGroupPolicies();
				};

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
					// $scope.selectedPolicy.selected = false;
					$scope.groupPolicies.forEach(function(p){
						if(p.id === policy.id){
							p.selected = true;
							$scope.selectedPolicy = p;
						}else{
							p.selected= false;
						}
					})
				};

				$scope.getPolicyById = function(policyId){

				}

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
					focusEditor();
					event.preventDefault();
				})

				if ($scope.autofocus) {
					focusEditor();
				}

				function focusEditor() {
					$timeout(function() {
						if ($scope.value) {
							placeCaretAtEnd(editor[0]);
						} else {
							placeCaretAtStart(editor[0])
						}
					})
				}
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
				isBlured: "=sinBlured"
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
					hashInput = $scope.hash.ele,
					hashInputTyped,
					editor = element,
					hashIndicator = [{'name':'hash-refer','notation':'@'},{'name':'hash-stuff','notation':'#'}],
					currHash;

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
					})
					.bind('keydown', 'shift+3', function(event) {
						if (!$scope.hash.constructed) {
							$scope.hash.hashType = currHash = hashIndicator[1];
							insertNodeAtCursor(hashInput.get(0));
							hashInput
								.autoGrowInput({
									minWidth: 10,
									comfortZone: 10
								}).focus();
							$scope.hash.constructed = true;
							$compile(hashInput)($scope);
						}
					})

				hashInput
					.bind('keydown', 'space esc', function(e) {
						$scope.finishHash();
						e.preventDefault();
					});

				$scope.$watch('hash.typed', function() {
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
							hashInputTyped = angular.element('<input value=' +
								$scope.users[$scope.users.length - 1].typed +
								' class="hash-input readonly '+currHash.name+'" readonly>');
							replaceHashWith(hashInputTyped,

								function() {
									hashInputTyped.autoGrowInput({
										minWidth: 10,
										comfortZone: 0
									});
									hashInputTyped.next('span').remove();
									hashInputTyped.next('span').remove();
								});

						}
						$scope.hash.hashing = false; //end hashing process
					}
				};

				function initHash() {
					$scope.hash = {
						ele: angular.element('<input ng-model="hash.typed" ng-trim="false" class="hash-input" ng-focus="hash.inCaret=true" ng-blur="hash.inCaret=false" autofocus="true" kr-input>'),
						typed: '',
						submit: false,
						focus: false,
						inCaret: false,
						hashing: false
					};
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
					})

					destroyHash();
					initHash();
				};

				function destroyHash() {
					$timeout(function() {
						hashInput.next('span').remove();
						hashInput = hashInput.detach();
						$scope.hash.constructed = false;
						$compile(hashInput)($scope);
						read();
					})
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
			// require: "^sinEditor",
			scope: {
				hash: "=sinHash"
			},
			controller: function($scope, $filter, HashList) {
				// $scope.hashlist = HashList.get($scope.hash.hashType);
				$scope.focusIndex = 0;
				$scope.$watch('hash.hashType', function(value){
					if(typeof value !== 'undefined'){
						HashList.get(value.notation).then(function(result){
							$scope.hashlist = result;
						});
					}
				})
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
							typed: $scope.filteredResult[$scope.focusIndex].name
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
			templateUrl: 'partials/partial-typeahead.html',
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
