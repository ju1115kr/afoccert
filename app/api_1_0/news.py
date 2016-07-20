# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, url_for, g
from . import api
from authentication import auth
from .. import db
from ..models import News, User, Comment
from errors import not_found, forbidden, bad_request
from datetime import datetime
from flask.ext.cors import cross_origin


@api.route('/news', methods=['GET'])  # 전체 신송 요청
@auth.login_required
def get_all_news():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = News.query.order_by(News.created_at.desc()).paginate(
        page, per_page, error_out=False)
    pag_news = pagination.items
    return jsonify({'news': [news.to_json() for news in pag_news]})


@api.route('/news/<int:id>', methods=['GET'])  # 특정 신송 요청
@auth.login_required
def get_news(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    return jsonify(news.to_json())


@api.route('/news', methods=['POST'])  # 신송 작성
@auth.login_required
@cross_origin(expose_headers='Location')
def post_news():
    if request.json is None:
        return bad_request('JSON Request is invaild')
    news = News.from_json(request.json)
    news.author_id = g.current_user.id
    news.author_name = g.current_user.realname
    db.session.add(news)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_news',
                                       id=news.id)  # 만들어진 신송 URI 제공
    resp.status_code = 201
    return resp


@api.route('/news/<int:news_id>', methods=['PUT'])  # 신송 수정
@auth.login_required
def put_news(news_id):
    if request.json is None:  # 요청이 올바르지 않은 경우
        return bad_request('JSON Request is invaild')
    old_news = News.query.filter_by(id=news_id).first()
    if old_news is None:  # 신송이 존재 하지 않을 경우
        return not_found('News does not exist')
    if g.current_user.id != old_news.author_id:  # 다른 유저의 신송을 수정하려고 하는 경우
        return forbidden('Cannot modify other user\'s news')
    news = News.from_json(request.get_json())
    old_news.context = news.context
    old_news.author_name = g.current_user.realname
    old_news.modified_at = datetime.utcnow()
    return jsonify(old_news.to_json())


@api.route('/news/<int:news_id>', methods=['DELETE'])  # 신송 삭제
@auth.login_required
def delete_news(news_id):
    news = News.query.filter_by(id=news_id).first()
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:  # 다른 유저의 신송을 삭제하려고 하는 경우
        return forbidden('Cannot delete other user\'s news')
    Comment.query.filter(Comment.news_id == news.id).delete()
    db.session.delete(news)
    db.session.commit()
    return '', 204


@api.route('/news/<int:news_id>/comments', methods=['GET'])  # 특정 신송의 모든 덧글 조회
@auth.login_required
def get_news_comments(news_id):
    # if request.json is None:
    #     return bad_request('JSON Request is invaild')
    news = News.query.get(news_id)
    if news is None:
        return not_found('News does not exist')
    return jsonify({'comments': [comment.to_json() for comment in news.comments if comment.parent_id is None]})


@api.route('/news/<int:news_id>/comments', methods=['POST'])  # 특정 신송에 덧글 작성
@auth.login_required
@cross_origin(expose_headers='Location')
def post_news_comment(news_id):
    if request.json is None:
        return bad_request('JSON Request is invaild')
    news = News.query.get(news_id)
    if news is None:
        return not_found('news does not exist')
    comment = Comment.from_json(request.json)
    comment.news_id = news.id
    comment.author_id = g.current_user.id
    comment.author_name = g.current_user.realname
    db.session.add(comment)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_comment', comment_id=comment.id)
    resp.status_code = 201
    return resp

    
