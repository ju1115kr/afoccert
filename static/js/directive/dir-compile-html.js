'use strict';

var app = angular.module('certApp');

app
    .directive('compileHtml', function($parse, $sce, $compile, $q, News){
        return {
            restrict: "A",
            transclude: true,
            controller: function($scope){
                $scope.hashNews = [];
            },
            link : function( scope, elem, attr){
                var expression = $sce.parseAsHtml(attr.compileHtml);
                var reg = new RegExp('(#(([0-9]+){2,}|([3-9])))','gm');
                scope.$watch(expression, function(newValue) {
                    var wrapper = angular.element('<div></div>').html(newValue);
                    var eleDeferred = $q.defer();
                    if(attr.compileHash == 'true'){
                        wrapper[0] = getTextNodesIn(wrapper[0], reg,  function(str){
                            scope.hashNews.push(str.slice(1)); // strip '#'
                            return '<span class="snackbar">'+str+'</span>';
                        },0);

                        var attachDeferred = [];
                        scope.hashNews.forEach(function(newsId){
                            var deferred = $q.defer();
                            News.query({'newsId': newsId},function(news){
                                deferred.resolve(news);
                            }, function(err){
                                deferred.resolve(); // if use 'reject', $q fail immediately
                            })
                            attachDeferred.push(deferred.promise);
                        });
                        scope.attachments = [];
                        $q.all(attachDeferred).then(function(newses){
                            newses.forEach(function(news,i){
                                if(news) {
                                    console.log(news)
                                    scope.attachments.push(news);
                                    wrapper.append('<attachment attach-data="attachments[' + (scope.attachments.length-1) + ']"></attachment>');
                                }
                            })
                            eleDeferred.resolve(wrapper);
                        });
                    }else{
                        eleDeferred.resolve(wrapper);
                    }
                    eleDeferred.promise.then(function(ele){
                        $compile(ele)(scope);
                        elem.html(ele);
                    });
                })
            }
        }
    })

function getTextNodesIn(elem, reg, callback, count) {
    if(elem){
        for (var nodes = elem.childNodes, i = nodes.length-1; i>=0; i--){
            var node = nodes[i], nodeType = node.nodeType;
            if(nodeType == 3){
                var text = node.nodeValue;
                if(reg.test(text)){
                    var replacementNode = document.createElement('span');
                    replacementNode.innerHTML = text.replace(reg, callback);
                    node.parentNode.insertBefore(replacementNode, node);
                    node.parentNode.removeChild(node);
                }
                elem.childNodes[i] = node;
            }
            else if (nodeType == 1 || nodeType == 9 || nodeType == 11){
                elem.childNodes[i] = getTextNodesIn(node, reg, callback,++count);
            }
        }
    }
    return elem;
}