'use strict';

var app = angular.module('certApp');

app.factory('Toolbar', function() {
	return {
		get: function() {
			return [{
				'icon': 'glyphicons glyphicons-bold',
				'func': function(){
					document.execCommand('bold',false,null);
				},
				'action':'bold'
			}, {
				'icon': 'glyphicons glyphicons-italic',
				'func': function(){
					document.execCommand('italic',false,null)
				},
				'action':'italic'
			}, {
				'icon': 'glyphicons glyphicons-text-underline',
				'func': function(){
					document.execCommand('underline',false,null)
				},
				'action':'underline'
			},{
				'icon': 'glyphicons glyphicons-text-strike',
				'func': function(){
					document.execCommand('strikeThrough',false,null)
				},
				'action':'strikeThrough'
			},{
				'icon': 'glyphicons glyphicons-align-center',
				'func': function(){
					document.execCommand('formatblock', false, 'div')
                 	 var listId = window.getSelection().focusNode;
                 	 $(listId).addClass("txt-center");
				},
				'action':'strikeThrough'
			},{
				'icon': 'glyphicons glyphicons-text-size',
				'func': function(){
					
				},
				'action':'strikeThrough'
			}]
		}
	}
});