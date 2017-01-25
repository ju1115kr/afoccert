# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from . import api
from authentication import auth
from ..models import News, User, Comment
from errors import not_found, forbidden, bad_request
from datetime import datetime


@api.route('/search/news/<context>', methods=['GET'])
@auth.login_required
def search_news(context):
    if context is None:
        return bad_request('Request is invaild')

    context = context.lower()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 60, type=int)
    pagination = News.query\
                    .filter(News.parsed_context.like('%'+context+'%'))\
                    .order_by(News.id.desc())\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items
	
    if pagination is None:
        return not_found('Result does not exist')
    return jsonify({'news':[news.to_json() for news in pag_result\
            if news.house is None or g.current_user in news.house.users\
                or g.current_user.id == news.house.create_user]})


@api.route('/search/comments/<context>', methods=['GET'])
@auth.login_required
def search_comment(context):
    if context is None:
        return bad_request('Request is invaild')

    context = context.lower()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 60, type=int)
    pagination = Comment.query\
                    .filter(Comment.parsed_context.like('%'+context+'%'))\
                    .order_by(Comment.news_id.desc())\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items

    if pagination is None:
        return not_found('Comment does not exist')
    return jsonify({'comments':[comment.to_json() for comment in pag_result\
            if comment.news.house is None or g.current_user in comment.news.house.users\
                or g.current_user.id == news.house.create_user]})


@api.route('/search', methods=['GET'])
@auth.login_required
def search_allmight():
    startpoint = request.args.get('startpoint')
    endpoint = request.args.get('endpoint')
    context = request.args.get('context')

    context = context.lower()
    if startpoint is None: startpoint = News.query.order_by(News.id.asc()).first().created_at
    if endpoint is None: endpoint = News.query.order_by(News.id.desc()).first().created_at

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 60, type=int)
    search_result = News.query\
                    .filter(endpoint > News.created_at)\
                    .filter(News.created_at > startpoint).order_by(News.id.desc())\
                    .filter(News.parsed_context.like('%'+context+'%'))\
                    .paginate(page, per_page, error_out=False)
    pag_result = pagination.items
	
    if context is None:  # 특정 구문이 주어지지 않은 경우
        return jsonify({'news':[news.to_json() for news in pag_result\
            if news.house is None or g.current_user in news.house.users\
            or g.current_user.id == news.house.create_user]})

    if pag_result is None:
        return not_found('News does not exist')

    return jsonify({'news':[news.to_json() for news in pag_result\
            if news.house is None or g.current_user in news.house.users\
                or g.current_user.id == news.house.create_user]})
