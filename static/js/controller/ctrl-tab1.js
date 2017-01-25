'use strict';

angular.module('certApp')

    .controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $q, $http, $location, $uibModal, News, $window,Comments, Reply, Blob, Processing, Issue, Utils) {
        var section = 'index',
            currSegment = 'tab1',
            detailSegment = 'detail';
        $scope.getDetailSegment = function(){
            return section+'.'+currSegment+'.'+detailSegment;
        }

        /**
         * Editor state
         * @type {{style: string, show: boolean, onIssue: boolean}}
         */
        $scope.editor = {
            style : '',
            show : false,
            onIssue : false
        };
        /**
         * Tracking editor ovelapped state
         * @type {{state: boolean, ele: null}}
         */
        $scope.overlapped = {
            state: false,
            ele : null
        };
        /**
         * Issue state/data
         */
        $scope.issue = {
            title: '',
            opening: true,
            indetail: false
        };

        $scope.$watch('overlapped', function(obj,old){
            if(obj.state === true && old.state === false){
                var height = obj.height;
                $scope.editor.style = 'height:'+height+'px';
                $scope.editor.show = true;
            }else if(obj.state === false && old.state === true){
                $scope.editor.style = 'height:auto';
                $scope.editor.show = false;
            }
        })
        $scope.toggleNote = function(){
            $scope.editor.show = !$scope.editor.show;
        }
        $scope.newses = [];
        $scope.fetching = false;
        $scope.fetchedAll = false;
        $scope.editorReady = false;
        function fetchNewPage(startPage) {
            return function () {
                $scope.fetching = true;
                News.queryAll({page: startPage, per_page: 20})
                    .$promise
                    .then(function(result){
                        $scope.editorReady = true;
                        var newses = [];
                        result.forEach(function(news){
                            newses.push(Processing.classification(news));
                        })
                        $scope.newses = $scope.newses.concat(newses);
                        $scope.fetching = false;
                        startPage++;
                        return newses;
                    })
                    .then(function(newses){
                        if(newses.length==0){
                            $scope.fetchedAll = true;
                        }
                    });
            }
        }

        var fetchNewses = fetchNewPage(1);
        fetchNewses();

        $scope.$on('scrollBottom', function () {
            if(!$scope.fetching && !$scope.fetchedAll){
                fetchNewses();
            }
        })

        $scope.addNews = function (text, model, files, group) {
            if($scope.editor.onIssue){
                if($scope.issue.title.length != 0){
                    var req = angular.copy($scope.issue);
                    var dummyDeferred = $q.defer();
                    var issueDeferred = $q.defer();
                    Issue.dummy(req, function(data, headers){
                        $http({
                            method:'GET', url: headers('Location')
                        }).success(function(data, status, headers, config){
                            dummyDeferred.resolve(data);
                        });
                    });
                    dummyDeferred.promise
                        .then(function(dummy){
                            return $q.all([Utils.saveNews(text,files,null), dummy]);
                        })
                        .then(function(arr){
                            /**
                             * news의 issue화
                             */
                            Issue.assignNews(
                                {
                                    ancestorId:arr[1].ancestor,
                                    newsId: arr[0].id
                                },
                                {
                                    opening: $scope.issue.opening
                                },
                                function(issue, headers){
                                    $http({
                                        method:'GET', url: headers('Location')+'/news'
                                    }).success(function(data, status, headers, config){
                                        issueDeferred.resolve(data);
                                    });
                                }
                            );
                        });
                    issueDeferred.promise.then(function(unprocessedIssue){
                        model.unshift(Processing.issue(unprocessedIssue));
                    });
                }
            }else {
                Utils.saveNews(text,files,group).then(function(news){
                    model.unshift(news);
                })
            }
        };

    })
    .controller('ModalDeleteCtrl', function ($scope, $uibModalInstance, News, deleteList, $q) {
        $scope.deleteList = deleteList.get();
        $scope.delete = function (item) {
            News.delete({newsId: item.id}, function () {
                item.deleted = true;
                deleteList.clear(item);
                if($scope.deleteList.length==0){
                    $uibModalInstance.close();
                }
            });
            deleteList.clear(item);
            if($scope.deleteList.length == 0){
                $uibModalInstance.close();
            }
        }
        $scope.rollback = function (item) {
            deleteList.clear(item);
            if($scope.deleteList.length == 0){
                $uibModalInstance.close();
            }
        }
        $scope.deleteAll = function(){
            angular.forEach($scope.deleteList, function(item){
                $scope.delete(item);
            })
            $q.all($scope.deleteList, function(){
                $uibModalInstance.close();
            })
        }
        $scope.rollbackAll = function(){
            deleteList.clearAll();
            $uibModalInstance.dismiss('rollbackAll');
        }
    })
    .factory("deleteList", function(){
        var list = {
            value:[],
            add: function(value){
                for (var i = 0; i < this.value.length; i++) {
                    if (value === this.value[i]){
                        return;
                    }
                }
                this.value.push(value);
            },
            get: function(){
                return this.value;
            },
            clear: function(value){
                for (var i = 0; i < this.value.length; i++) {
                    if (value === this.value[i]){
                        this.value.splice(i,1);
                    }
                }
            },
            clearAll: function(){
                this.value = [];
            }
        };
        return list;
    });
