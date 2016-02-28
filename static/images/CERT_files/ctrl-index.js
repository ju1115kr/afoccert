'use strict';

angular.module('certApp').controller('IndexCtrl', function($scope, RouteLinkProvider){
    $scope.section = '';
    $scope.link_provider = RouteLinkProvider;
    $scope.sidebarObjects = [
        {
            title: '',
            buttons: [
                {
                    name: '신송',
                    link: 'tab1',
                    icon: 'glyphicons glyphicons-globe'
                },
                {
                    name: '맘터',
                    link: 'inspect',
                    icon: 'glyphicon-ok'
                },
                {
                    name: '먹고싶으셰여?',
                    link: 'analysis-report',
                    icon: 'glyphicon-stats'
                },
                {
                    name: '=이주영 극혐',
                    link: 'analysis-report',
                    icon: 'glyphicon-stats'
                }
            ]
        }
    ]
})
