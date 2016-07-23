# -*- coding:utf-8 -*-
from flask import request, jsonify, g
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

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 1000, type=int)
    pagination = News.query\
                    .order_by(News.id.desc())\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items
	
    for news in pag_result:
        if news.parsed_context is None:
            news.parsed_context = removeEscapeChar(news.context)
    if pagination is None:
        return not_found('Result does not exist')
    return jsonify({'news':[news.to_json() for news in pag_result if context in news.parsed_context]})


@api.route('/search/comments/<context>', methods=['GET'])
@auth.login_required
def search_comment(context):
    if context is None:
        return bad_request('Request is invaild')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 1000, type=int)
    pagination = Comment.query\
                    .order_by(Comment.news_id.desc())\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items

    for comment in pag_result:
        if comment.parsed_context is None:
            comment.parsed_context = removeEscapeChar(comment.context)
    if pagination is None:
        return not_found('Comment does not exist')
    return jsonify({'comments':[comment.to_json() for comment in pag_result if context in comment.parsed_context]})


@api.route('/search', methods=['GET'])
@auth.login_required
def search_allmight():
    startpoint = request.args.get('startpoint')
    endpoint = request.args.get('endpoint')
    context = request.args.get('context')

    if startpoint is None:
        startpoint = News.query.order_by(News.id.asc()).first().created_at
    if endpoint is None:
        endpoint = News.query.order_by(News.id.desc()).first().created_at

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 1000, type=int)
    search_result = News.query.filter(endpoint > News.created_at)\
                    .filter(News.created_at > startpoint).order_by(News.id.desc())\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items
	
    if context is None:
        return jsonify({'news':[news.to_json() for news in pag_result]})
    for news in pag_result:
        if news.parsed_context is None:
                news.parsed_context = removeEscapeChar(news.context)
    if pag_result is None:
        return not_found('News does not exist')
    return jsonify({'news':[news.to_json() for news in pag_result if context in news.parsed_context]})