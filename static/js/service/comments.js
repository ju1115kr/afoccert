'use strict';

var app = angular.module('certApp');

app.factory('Comments', function($resource, $sce){
	return $resource(window.api_url+'/comments/:commentId', {},
		{
			fromNews: {
				method: 'GET',
				url: window.api_url+'/news/:newsId/comments',
				isArray: true,
				transformResponse: function(data){
					try {
						data = JSON.parse(data);
						// var comments = [];
						// for(var i=0; i<data.comments.length; i++){
						// 	var comment = data.comments[i];
						// 	serializer(comment, 'context', 'text');
						// 	comment.trustText = $sce.trustAsHtml(comment.text);
						// 	comments.push(comment);
						// }
						return data.comments;
					} catch (e) {
						return;
					}
				}
			},
			toNews: {
				method: 'POST',
				url: window.api_url+'/news/:newsId/comments'
			},
			delete: {
				method :'DELETE'
			},
			update:{
				method:'PUT'
			},
			fetchFile: {
				url : window.api_url+'/comments/:commentId/file',
				method: 'GET',
				responseType: 'arraybuffer',
				transformResponse : function(data, headers){
					return {
						data: data
					}
				}
			},
			deleteFile: {
				url : window.api_url+'/comments/:commentId/file',
				method: 'DELETE'
			}

		})
}).factory('Reply', function($resource){
	return $resource(window.api_url+'/comments/:commentId', {}, {
		toComment: {
			method: 'POST'
		},
		fromComment: {
			method: 'GET',
			url : window.api_url+'/comments/:commentId/comments'
		},
		fetchFile: {
			url : window.api_url+'/comments/:commentId/file',
			method: 'GET',
			responseType: 'arraybuffer',
			transformResponse : function(data, headers){
				return {
					data: data
				}
			}
		},
		deleteFile: {
			url : window.api_url+'/comments/:commentId/file',
			method: 'DELETE'
		}
	})
})
