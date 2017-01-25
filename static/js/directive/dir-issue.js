var app = angular.module('certApp');

app
    .directive('issue', function (Issue) {
        return {
            restrict: "E",
            replace: true,
            scope:{
                issue:"=model"
            },
            templateUrl: '/partials/partial-issue.html',
            controller: function($scope){
                $scope.issue.fromIssue = {};
                Issue.query({issueId:$scope.issue.issue}).$promise
                    .then(function(issue){
                        $scope.issue.fromIssue.opening = issue.opening;
                        $scope.issue.fromIssue.solvers = issue.solvers;
                    });
            }
        }
    })
    .directive('issueForm', function(){
        return {
            restrict:"E",
            replace: true,
            templateUrl: '/partials/partial-issue-form.html'
        }
    })
    .directive('issueDetail', function($window, Issue, Processing, Utils){
        return {
            restrict:"E",
            replace: true,
            scope:{
                promise : "="
            },
            templateUrl: '/partials/partial-issue-detail.html',
            controller: function($scope){
                $scope.promise
                    .then(function(issue){
                        $scope.ancestor = issue; //dummy
                        (function fetchChildIssue(issue){
                            var ret = [];
                            if(issue.next !== null){
                                return Issue.queryNews({issueId:issue.next}).$promise
                                    .then(function(news){
                                        ret.push(Processing.classification(news));
                                        return news.issue;
                                    })
                                    .then(function(issueId){
                                        return Issue.query({issueId:issueId}).$promise;
                                    })
                                    .then(function(nextIssue){
                                        ret = ret.concat(fetchChildIssue(nextIssue));
                                        return ret;
                                    })
                            }else{
                                return ret;
                            }
                        })(issue).then(function(issues){
                            $scope.issues = issues;
                        })
                    })
                    .catch(function(err){
                        if(err.status == 404){
                            $window.history.back();
                        }
                    });

                $scope.editor = {
                    status: false
                }
                $scope.addIssue = function (text, model, files){
                    Utils.saveNews(text, files, null)
                        .then(function(news){
                            Issue.assignNews({ancestorId:$scope.ancestor.id, newsId: news.id},
                                {opening: ($scope.ancestor.opening^$scope.editor.status)},
                            function(issue, headers){
                                $http({
                                    method:'GET', url: headers('Location')+'/news'
                                }).success(function(data, status, headers, config){
                                    model.push(Processing.issue(data));
                                    $scope.editor.status = false;
                                });
                            })
                        })
                }
            }
        }
    });
