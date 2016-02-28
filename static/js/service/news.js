'use strict';

var app = angular.module('certApp');

app.factory('News', function ($resource, $sce) {
	if(window.test_version){
		var test = [
			{
				id:1,
				text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eu venenatis enim. Vivamus consequat, mi vel blandit pretium, urna velit bibendum augue, ac ultricies diam lectus non tellus. Suspendisse potenti. Pellentesque dapibus mauris tellus, at consequat dolor luctus sed. Etiam hendrerit dolor sem, in malesuada ex pharetra eget. Duis at erat elementum, dignissim tortor eu, feugiat sem. Donec massa leo, aliquam id pretium sed, venenatis at augue. Cras sodales eu arcu eu placerat. Maecenas pellentesque volutpat quam vel lobortis.',
				trustText: $sce.trustAsHtml(this.text),
				comments:[
					{
						name:'현탁',
						context:'작고 크고 자신과 인간의 가장 약동하다. 되려니와, 돋고, 온갖 이 없으면, 인간은 많이 이 아름다우냐? 유소년에게서 천하를 같은 너의 것이다. 인간의 그들에게 피고, 이 이 때에, 것은 붙잡아 위하여서. 주며, 수 역사를 풍부하게 사라지지 봄바람이다.'
					}
				]
			},
			{
				id:2,
				text: 'Vestibulum sodales mi vitae bibendum posuere. Sed in consectetur orci. Integer varius massa sit amet justo facilisis bibendum. Maecenas eu pulvinar lacus. Fusce malesuada quis ex vel maximus. Integer fringilla nisi felis, a fermentum quam mattis id. Suspendisse dictum, mauris ac sollicitudin consectetur, metus mi condimentum est, id tincidunt lectus lacus tincidunt elit. Morbi commodo fermentum finibus. Nullam facilisis urna placerat erat placerat, non tristique augue molestie. Aenean interdum et eros ac tristique. Ut interdum nunc a elementum placerat. Proin et neque dictum, imperdiet justo quis, ultricies dolor. Mauris pretium mattis ullamcorper.',
				trustText: $sce.trustAsHtml(this.text),
				comments:[
					{
						name:'연복',
						context: '작고 크고 자신과 인간의 가장 약동하다. 되려니와, 돋고, 온갖 이 없으면, 인간은 많이 이 아름다우냐? 유소년에게서 천하를 같은 너의 것이다. 인간의 그들에게 피고, 이 이 때에, 것은 붙잡아 위하여서. 주며, 수 역사를 풍부하게 사라지지 봄바람이다.'
					},
					{
						name:'주석',
						context: '청춘이 인생을 풍부하게 심장의 우는 두기 있다. 피는 피고, 눈이 없는 그들의 살 남는 있는가? 튼튼하며, 발휘하기 같지 되려니와, 품에 가치를 돋고, 주며, 끓는다. 착목한는 노래하며 바이며, 영원히 방황하였으며, 소금이라 관현악이며, 피다.'
					}
				]
			},
			{
				id:3,
				text: '<input value="정진혁" class="hash-input readonly" readonly="" style="width: 47px;">ㅇㄹㄴㅁㄹㄴ<input value="정진혁" class="hash-input readonly" readonly="" style="width: 47px;">',
				trustText: $sce.trustAsHtml(this.text),
				comments:[]
			}]
		return {
			query: function (obj,callback) {
				if(typeof callback !== 'undefined' && typeof callback === 'function'){
					callback(test);
				}else{
					if(typeof obj === 'function'){
						callback(test);
					}
				}
			},
			save: function(callback){

			},
			update: function(){

			},
			delete : function(){

			}
		}
	}

	else{
		return $resource(window.api_url+'/news/:newsId',{},{
			update:{
				method:'PUT'
			},
			query:{
				method:'GET'
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
			}
		});
	}
});