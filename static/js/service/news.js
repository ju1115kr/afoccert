'use strict';

var app = angular.module('certApp');

app.factory('News', function ($resource, $sce, $q) {

	return $resource(window.api_url+'/news/:newsId',{},{
		update:{
			method:'PUT'
		},
		query:{
			method:'GET',
			isArray:true,
			transformResponse: function(data){
				try {
					data = JSON.parse(data);
					// var newses = [];
					// for(var i=0; i<data.news.length; i++){
					// 	var news = new CNews(data.news[i]);
					// 	news.trustText = $sce.trustAsHtml(news.text);
					// 	news.fetchingComment = true;
					// 	news.comments = [];
					// 	news.comments.newsId = news.id;
					// 	newses.push(news);
					// }
					return data.news;
				} catch (e) {
					return;
				}
			}
		},
		save:{
			method:'POST',
			transformResponse : function(data, headers){
				var response = {};
				response.data = data;
				response.headers = headers();
				return response;
			}
		},
		delete:{
			method :'DELETE'
		},
		fetchFile: {
			url : window.api_url+'/news/:newsId/file',
			method: 'GET',
			responseType: 'arraybuffer',
			transformResponse : function(data, headers){
				return {
					data: data
				}
			}
		},
		deleteFile: {
			url : window.api_url+'/news/:newsId/file',
			method: 'DELETE'
		}
	});
});
