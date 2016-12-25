var app = angular.module('certApp');

app
    .directive('issueForm', function(){
       return {
           restrict:"E",
           replace: true,
           templateUrl: '/partials/partial-issue-form.html'
       }
    })
    .directive('issueDetail', function(){
        return {
            restrict:"E",
            replace: true,
            templateUrl: '/partials/partial-issue-detail.html'
        }
    });
