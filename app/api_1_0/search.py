# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, url_for, g
from . import api
from authentication import auth
from .. import db
from ..models import News, User, Comment
from errors import not_found, forbidden, bad_request
from datetime import datetime
import re

def removeEscapeChar(context): #Frontsize의 HTML 태그 제거
	str = re.sub("(<([^>]+)>)", "", context)
	str = str.replace('&nbsp;', "").replace('&lt;', "<").replace('&gt;', ">")\
		.replace('&amp;', "&").replace('&quot;', '"')
	return str

@api.route('/search/news/<context>', methods=['GET'])
@auth.login_required
def search_news(context):
	if context is None:
		return bad_request('Request is invaild')

	context = removeEscapeChar(context)
	search_result = News.query.filter(News.context.like('%'+context+'%')).order_by(News.id.desc()).all()

	if search_result is None:
		return not_found('News does not exist')
	return jsonify({'news':[news.to_json() for news in search_result]})


@api.route('/search/comments/<context>', methods=['GET'])
@auth.login_required
def search_comment(context):
	if context is None:
		return bad_request('Request is invaild')

	context = removeEscapeChar(context)
	search_result = Comment.query.filter(Comment.context.like('%'+context+'%')).order_by(Comment.news_id.desc()).all()
	if search_result is None:
		return not_found('Comment does not exist')
	return jsonify({'comments':[comment.to_json() for comment in search_result]})


@api.route('/search/', methods=['GET'])
@auth.login_required
def search_date():
	startpoint = request.args.get('startpoint')
	endpoint = request.args.get('endpoint')
	context = request.args.get('context')

	context = removeEscapeChar(context)

	if startpoint is None:
		startpoint = "2016-02-04" #At first news
	if endpoint is None:
		endpoint = datetime.utcnow()
	if context is None:
		search_result = News.query.filter(endpoint > News.created_at)\
				.filter(News.created_at > startpoint).order_by(News.id.desc()).all()

	search_result = News.query.filter(endpoint > News.created_at)\
			.filter(News.created_at > startpoint)\
			.filter(News.context.like('%'+context+'%')).order_by(News.id.desc()).all()
 
	if search_result is None:
		return not_found('News does not exist')
	return jsonify({'news':[news.to_json() for news in search_result]})
