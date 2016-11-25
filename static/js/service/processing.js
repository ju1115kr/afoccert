'use strict';

var app = angular.module('certApp');

app.factory('Processing',function($sce){
    return {
        news : function(news){
            var newsInstance = new CNews(news);
            newsInstance.trustText = $sce.trustAsHtml(newsInstance.text);
            newsInstance.comments = [];
            newsInstance.comments.newsId = news.id;
            return newsInstance;
        },
        comment : function(comment){
            var comment = new CComment(comment);
            comment.trustText = $sce.trustAsHtml(comment.text);
            return comment;
        },
        reply: function(reply){
            var reply = new CReply(reply);
            reply.trustText = $sce.trustAsHtml(reply.text);
            return reply;
        },
    }
})
/**
 * Created by cert on 2016-11-26.
 */
