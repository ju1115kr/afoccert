'use strict';

var app = angular.module('certApp');

app.factory('Processing',function($sce, $q, Issue){
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
        issue: function(issue){
            var issueInstance = new CIssue(issue);
            issueInstance.trustText = $sce.trustAsHtml(issueInstance.text);
            Issue.query({issueId:issue.issue}, function(_issue){
                Issue.query({issueId:_issue.ancestor}, function(_ancestorIssue){
                    issueInstance.ancestor = _ancestorIssue.ancestor;
                    issueInstance.issueTitle = _ancestorIssue.title;
                    issueInstance.issue_created_at = _ancestorIssue.created_at;
                })
            });
            return issueInstance;
        },
        classification: function(news){
            if(news.issue != null){
                return this.issue(news);
            }else{
                return this.news(news);
            }
        }
    }
})
/**
 * Created by cert on 2016-11-26.
 */
