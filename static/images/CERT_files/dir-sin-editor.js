'use strict';

var app = angular.module('certApp');

app
    .directive("sinEditor", function() {
        return {
            restrict: "A",
            scope: {
                submit: "&sinSubmit"
            },
            controller: function($scope, $sce, Toolbar) {
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
                $scope.toolbar = Toolbar.get();

                initEditor();

                function initEditor() {
                    $scope.editor = {
                        caret: {},
                        blured: false,
                        value: ''
                    };
                }
                $scope.pushTodo = function(value) {
                    var obj = {
                        todo: value // the key name 'todo' must sync with directive's 
                            //attirbute parameter of function 'submit'.
                    }
                    $scope.submit(obj);
                    initEditor();
                }
            },
            template: '<div class="toolbar">\
                <ul>\
                    <li ng-repeat="option in toolbar">\
                      <button ng-click="option.func()"><span class="{{option.icon}}"></span></button>\
                    </li>\
                </ul>\
            </div>\
            <div id="note" sin-note sin-hash="hash" contenteditable="true" ng-focus="finishHash()" ng-blur="finishHash(e)" ng-model="editor.value" autofocus>{{editor.value}}</div>\
            <div sin-typeahead sin-hash="hash" class="typeahead" ng-class="{show:hash.constructed}">\
            </div>\
            <div class="bottom">\
                <button ng-click="pushTodo(editor.value)" ng-disabled="!editor.value">작성완료</button>또는 <span class="emphasize" ng-class="{disabled:!editor.value}"><span class="key">alt</span>+<span class="key">s</span></span>\
            </div>',
            link: function($scope, element, attrs) {

                var editor = element.find("#note");

                editor.bind('keydown', 'alt+s', function(event) {
                    $scope.pushTodo($scope.editor.value);
                    event.preventDefault();
                })
            }
        };
    })
    .directive("sinTypeahead", function($filter) {
        return {
            restrict: "A",
            require: "^sinEditor",
            scope: {
                hash: "=sinHash"
            },
            controller: function($scope, $filter, HashList) {
                $scope.hashlist = HashList.get();
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
            template: '<ul class="hash-list">\
                    <li ng-class="{active:$index==focusIndex}" ng-mouseover="hoverIndex($index)" ng-mousedown="submitByClick($index,$event)"\
                     ng-repeat="result in filteredResult"><span>{{result.name}}</span></li>\
                    <li ng-if="filteredResult.length==0">결과가 없습니다</li>\
                </ul>',
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
    .directive("sinNote", function($compile, $timeout) {
        return {
            restrict: "A",
            require: "ngModel",
            scope: {
                hash: "=sinHash"
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
                    hashChar = '@';

                editor
                    .bind("blur keyup change", function() {
                        $scope.$apply(read);
                    })
                    .bind('keydown', 'shift+2', function(event) {
                        if (!$scope.hash.constructed) {
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

                hashInput
                    .bind('keydown', 'space esc', function(e) {
                        $scope.finishHash();
                        e.preventDefault();
                    });

                $scope.$watch('hash.typed', function() {
                    if ($scope.hash.constructed) {
                        if ($scope.hash.typed.length == 0) {
                            $scope.finishHash();
                        } else {
                            if ($scope.hash.typed.substring(0, 1) != hashChar) {
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

                $scope.finishHash = function() {
                    if ($scope.hash.constructed && !$scope.hash.hashing) {
                        $scope.hash.hashing = true;
                        if (!$scope.hash.submit) {
                            replaceHashWith($scope.hash.typed);
                        } else {
                            $scope.users.push($scope.hash.submit);
                            hashInputTyped = angular.element('<input value=' + $scope.users[$scope.users.length - 1].typed + ' class="hash-input readonly" readonly>');
                            replaceHashWith(hashInputTyped);
                            hashInputTyped.autoGrowInput({
                                minWidth: 10,
                                comfortZone: 0
                            });
                            hashInputTyped.next('span').remove();
                            hashInputTyped.next('span').remove();
                        }
                        $scope.hash.hashing = false;
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

                function replaceHashWith(ele) {
                    hashInput.before(ele);
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