/**
 * Created by cert on 2017-01-07.
 */
'use strict';

var app = angular.module('certApp');

app.factory('Utils',function($sce, $q, $http, Processing, Blob, News){
    return {
        saveNews : function saveNews(text, files, group){
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
    }
})
/**
 * Created by cert on 2016-11-26.
 */
