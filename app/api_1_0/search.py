# -*- coding:utf-8 -*-
from flask import request, jsonify, g
from . import api
from .access import can_read_news
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
            if can_read_news(news, g.current_user)]})


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
            if can_read_news(comment.news, g.current_user)]})


@api.route('/search', methods=['GET'])
@auth.login_required
def search_allmight():
    """Optional date-range and text search without leaking private news."""
    startpoint = request.args.get('startpoint')
    endpoint = request.args.get('endpoint')
    context = (request.args.get('context') or '').lower()
    page = max(1, request.args.get('page', 1, type=int))
    per_page = min(100, max(1, request.args.get('per_page', 60, type=int)))

    result = News.query
    if startpoint:
        try:
            start = datetime.strptime(startpoint, '%Y-%m-%d')
        except ValueError:
            return bad_request('startpoint must be YYYY-MM-DD')
        result = result.filter(News.created_at >= start)
    if endpoint:
        try:
            end = datetime.strptime(endpoint, '%Y-%m-%d')
        except ValueError:
            return bad_request('endpoint must be YYYY-MM-DD')
        result = result.filter(News.created_at < end)
    if context:
        result = result.filter(News.parsed_context.like('%' + context + '%'))

    pagination = result.order_by(News.id.desc()).paginate(
        page, per_page, error_out=False)
    return jsonify({'news': [news.to_json() for news in pagination.items
                            if can_read_news(news, g.current_user)]})
