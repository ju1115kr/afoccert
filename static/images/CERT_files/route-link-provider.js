'use strict';

angular.module('certApp').factory('RouteLinkProvider', function($location) {
    return {
        navigate: function() {
            var pathString = '';
            for(var i = 0; i < arguments.length; i++) {
                var path = arguments[i];
                pathString +=  path;
            }

            $location.path(pathString);
        }
    };
});
