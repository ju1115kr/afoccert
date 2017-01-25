'use strict';

var app = angular.module('certApp');

app.factory('Blob', function (News, Comments, Upload, $q) {
    function getConstructor(obj){
        if(obj instanceof CNews)
            return CNews.name;
        if(obj instanceof CComment)
            return CComment.name;
        if(obj instanceof CReply)
            return CReply.name;
        if(obj instanceof CIssue)
            return CIssue.name;
    }
    return {
        download: function(obj){
            var callback = function(file){
                var url = URL.createObjectURL(new Blob([file.data]));
                var a = document.createElement('a');
                a.href = url;
                a.download = obj.file;
                a.target = '_blank';
                a.click();
            };
            switch (getConstructor(obj)){
                case 'CNews' : ;
                case 'CIssue' : News.fetchFile({
                    newsId : obj.id
                }, callback);break;
                case 'CComment' : Comments.fetchFile({
                    commentId : obj.id
                }, callback);break;
                case 'CReply' : Comments.fetchFile({
                    commentId : obj.id
                }, callback);break;
            }
        },
        upload: function(obj, file){
            var uploadTo = '';
            var fileDeferred = $q.defer();
            switch (getConstructor(obj)){
                case 'CNews' : ;
                case 'CIssue' : uploadTo = 'news';break;
                case 'CComment' : uploadTo = 'comments';break;
                case 'CReply' : uploadTo = 'comments';break;
            }
            Upload.upload({
                url: window.api_url + '/'+uploadTo+'/' + obj.id + '/file',
                data: file
            }).then(function (resolved) {
                fileDeferred.resolve(resolved.data);
            });
            return fileDeferred.promise;
        }
    }
});