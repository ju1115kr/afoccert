'use strict';
var app = angular.module('certApp');

app.factory('Search',function($resource, $sce, Comments){
    return $resource(window.api_url+'/search/news/:keyword',{per_page:60},{
        fromNews: {
            method: 'GET',
            isArray: true,
            transformResponse: function(data){
				try {
					data = JSON.parse(data);
					var newses = [];
					for(var i=0; i<data.news.length; i++){
						var news = data.news[i];
						news.trustText = $sce.trustAsHtml(news.context);
						serializer(news, 'context', 'text');
                        news.fold = true;
						news.created = {};
						news.created.date = new Date().format('YY년 MM월 dd일', news.created_at);
						news.created.time = new Date().format('hh:mm', news.created_at);
						news.fetchingComment = true;
						news.comments = [];
						news.comments.newsId = news.id;
						newses.push(news);
					}
					return newses;
				} catch (e) {
					return;
				}
			}
        }
    })
})
