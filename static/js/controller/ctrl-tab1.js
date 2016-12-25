'use strict';

angular.module('certApp')

    .controller('Tab1Ctrl',function ($scope, $sce, $rootScope, $q, $http, $uibModal, News, $window, Comments, Reply, Blob, Processing, Issue) {
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
                var newsDeferred = $q.defer();
                News.queryAll(
                    {page: startPage, per_page: 20},
                    function (result) {
                        $scope.editorReady = true;
                        var newses = [];
                        result.forEach(function(news){
                            if(news.issue != null){
                                newses.push(Processing.issue(news));
                            }else{
                                newses.push(Processing.news(news));
                            }
                        })
                        $scope.newses = $scope.newses.concat(newses);
                        newsDeferred.resolve(newses);
                        $scope.fetching = false;
                        startPage++;
                    }
                );
                newsDeferred.promise.then(function(newses){
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
                    dummyDeferred.promise.then(function(dummy){
                        saveNews(text,files,null).then(function(news){
                            /**
                             * news의 issue화
                             */
                            Issue.assignNews(
                                {
                                    ancestorId:dummy.ancestor,
                                    newsId: news.id
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
                    });
                    issueDeferred.promise.then(function(unprocessedIssue){
                        model.unshift(Processing.issue(unprocessedIssue));
                    });
                }
            }else {
                saveNews(text,files,group).then(function(news){
                    model.unshift(news);
                })
            }
            function saveNews(text, files, group){
                var retDeferred = $q.defer();
                News.save({'context': text, 'tags':[], 'group':group}, function (data, headers) {
                    var newsDeferred = $q.defer();
                    $http({method: 'GET', url: headers('Location')}).success(function (data, stauts, headers, config) {
                        newsDeferred.resolve(data);
                    });
                    newsDeferred.promise.then(function(unprocessedNews){
                        var news = Processing.news(unprocessedNews);
                        if(files.data && files.data.length!==0) {
                            var file = {
                                file: files.data[0]
                            };
                            Blob.upload(news, file).then(function(fileAttachedNews){
                                news.update(fileAttachedNews);
                                retDeferred.resolve(news);
                            })
                        }else{
                            retDeferred.resolve(news);
                        }
                    })
                });
                return retDeferred.promise;
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
