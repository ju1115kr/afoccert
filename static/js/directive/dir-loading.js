'use strict';

var app = angular.module('certApp');

app.directive('loading',function(){
	return{
		restrict : 'E',
		scope: {
			isLoading: "=isLoading",
		},
		template: '<canvas id="loading-target" width="240" height="240"></canvas>',
		controller: function($scope){

		},
		link: function($scope, ele, attr){
			var bg = document.getElementById('loading-target');
			if(bg){
			var ctx = ctx = bg.getContext('2d');
			var imd = null;
			var circ = Math.PI * 2;
			var quart = Math.PI / 2;
			var tick = 0.000;
			var speed = 0.003;

			ctx.beginPath();
			ctx.strokeStyle = '#a2ded0';
			ctx.lineCap = 'square';
			ctx.closePath();
			ctx.fill();
			ctx.lineWidth = 10.0;

			imd = ctx.getImageData(0, 0, 240, 240);

			var draw = function(current) {
				ctx.clearRect(0,0,240,240);
    				ctx.putImageData(imd, 0, 0);
    				ctx.beginPath();
    				ctx.arc(120, 120, 70, -(quart) + ((circ)*(current)/test(current)), ((circ) * current) - quart, false);
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