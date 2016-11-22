'use strict';

var app = angular.module('certApp');

app.directive('loading',function(){
	return{
		restrict : 'E',
		scope: {
			isLoading: "=",
			size: "=",
			color: "="
		},
		replace: true,
		template: '<canvas id="loading-target" width="0" height="0"></canvas>',
		controller: function($scope){
		},
		link: function($scope, ele, attr){
			var bg = ele[0];
			if(bg){
				var ctx = ctx = bg.getContext('2d');
				var imd = null;
				var circ = Math.PI * 2;
				var quart = Math.PI / 2;
				var tick = 0.000;
				var speed = 0.003;
				var size = $scope.size;
				bg.width = bg.height = size;
				ctx.beginPath();
				ctx.strokeStyle = $scope.color || '#a2ded0';
				ctx.lineCap = 'square';
				ctx.closePath();
				ctx.fill();
				ctx.lineWidth = 10.0;

				imd = ctx.getImageData(0, 0, size, size);

				var draw = function(current) {
					ctx.clearRect(0,0,size,size);
					ctx.putImageData(imd, 0, 0);
					ctx.beginPath();
					ctx.arc(size/2, size/2, size/3, -(quart) + ((circ)*(current)/test(current)), ((circ) * current) - quart, false);
					ctx.stroke();
				}
				function test(x){
					return -(4)*Math.pow(x,2)+4*x+1;
				}
				setInterval(function(){
					draw(tick);
					tick+=speed;
					tick%=1;
				})
			}
		}
	}
})
