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
                var regHash = new RegExp('(#(([0-9]+){2,}|([3-9])))','gm');
                scope.$watch(expression, function(newValue) {
                    var wrapper = angular.element('<div></div>').html(newValue);
                    if(attr.compileHash == 'true'){
                        /**
                         * convert # Hash
                         */
                        wrapper[0] = getTextNodesIn(wrapper[0], regHash,  function(str){
                            scope.hashNews.push(str.slice(1)); // strip '#'
                            return '<span class="snackbar">'+str+'</span>';
                        },0);
                    }
                    /**
                     * convert @ Hash
                     */
                    var ele = document.createElement('div');
                    ele.innerHTML = wrapper.html();
                    var spans = ele.getElementsByTagName('span');
                    spans = Array.prototype.slice.call(spans);
                    for(var i =0; i<spans.length; i++){
                        if(spans[i].hasAttribute('class') &&
                            spans[i].getAttribute('class').split(' ').indexOf('hash-input')>-1){
                            var node = document.createElement('span');
                            node.innerHTML = spans[i].innerHTML.split('@')[1].split(':')[0];
                            node.setAttribute('class','hash-input readonly');
                            spans[i].parentNode.replaceChild(node, spans[i]);
                        }
                    }
                    wrapper.html(ele.innerHTML);

                    scope.attachments = [];
                    $q.all(scope.hashNews.map(function(newsId){
                        return News.query({'newsId':newsId}).$promise;
                    })).then(function(newses){
                        newses.forEach(function(news,i){
                            if(news) {
                                scope.attachments.push(news);
                                wrapper.append('<attachment attach-data="attachments[' + (scope.attachments.length-1) + ']"></attachment>');
                            }
                        })
                        // eleDeferred.resolve(wrapper);
                        return wrapper;
                    }).then(function(wrapper){
                        compile(wrapper, elem);
                    });

                    function compile(ele,parent){
                        $compile(ele)(scope);
                        parent.html(ele);
                    }
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