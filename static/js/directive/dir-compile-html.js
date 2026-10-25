'use strict';

var app = angular.module('certApp');

app
    .directive('compileHtml', function($parse, $sce, $compile, $q, $sanitize, News){
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
                    scope.hashNews = [];
                    var wrapper = angular.element('<div></div>').html($sanitize(newValue || ''));
                    if(attr.compileHash == 'true'){
                        /**
                         * convert # Hash
                         */
                        getTextNodesIn(wrapper[0], regHash, function(str){
                            scope.hashNews.push(str.slice(1)); // strip '#'
                        });
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
                            node.textContent = spans[i].textContent.split('@')[1].split(':')[0];
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
                    }, function(){
                        // An inaccessible #reference must not hide the post text.
                        compile(wrapper, elem);
                    });

                    function compile(ele, parent){
                        // Do not Angular-compile untrusted post HTML: interpolation
                        // such as {{ ... }} must remain inert text.
                        parent.empty();
                        while (ele[0].firstChild) {
                            parent[0].appendChild(ele[0].firstChild);
                        }
                        // Only our explicitly generated attachment elements are
                        // trusted Angular templates.
                        var attachments = parent[0].querySelectorAll('attachment');
                        for (var i = 0; i < attachments.length; i++) {
                            $compile(attachments[i])(scope);
                        }
                    }
                })
            }
        }
    })

/**
 * Convert #references in text nodes into badges.
 * Never concatenate arbitrary text into innerHTML.
 */
function getTextNodesIn(elem, reg, onReference) {
    if (!elem) {
        return elem;
    }
    var children = Array.prototype.slice.call(elem.childNodes);
    children.forEach(function(node){
        if (node.nodeType === 3) {
            var value = node.nodeValue;
            var fragment = document.createDocumentFragment();
            var cursor = 0;
            var match;
            reg.lastIndex = 0;
            while ((match = reg.exec(value)) !== null) {
                fragment.appendChild(document.createTextNode(
                    value.slice(cursor, match.index)));
                var badge = document.createElement('span');
                badge.className = 'snackbar';
                badge.textContent = match[0];
                fragment.appendChild(badge);
                onReference(match[0]);
                cursor = reg.lastIndex;
                if (!match[0].length) {
                    break;
                }
            }
            if (cursor > 0) {
                fragment.appendChild(document.createTextNode(value.slice(cursor)));
                node.parentNode.replaceChild(fragment, node);
            }
        } else if (node.nodeType === 1) {
            getTextNodesIn(node, reg, onReference);
        }
    });
    return elem;
}
