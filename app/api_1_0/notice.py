# -*- coding:utf-8 -*-
from flask import jsonify, g
from . import api
from .access import can_read_news
from .. import db
from authentication import auth
from ..models import News
from errors import not_found, forbidden


@api.route('/notice', methods=['GET'])  # 타임라인 내 공지 신송 요청
@auth.login_required
def get_notice_news():
	notice_news = News.query.filter_by(notice = True).order_by(News.created_at.desc()).all()
	if notice_news is None:
		return not_found('News does not exist')
	return jsonify({'notice' : [news.to_json() for news in notice_news\
			if can_read_news(news, g.current_user)]}), 200 


@api.route('/notice/<int:news_id>', methods=['PUT'])  # 특정 신송 공지화
@auth.login_required
def put_notice_news(news_id):
	news = News.query.filter_by(id = news_id).first()
	if news is None:
		return not_found('News does not exist')
	if g.current_user.id != news.author_id:
		return forbidden('Cannot change other user\'s news')
	news.notice = True
	db.session.commit()
	return jsonify(news.to_json())


@api.route('/notice/<int:news_id>', methods=['DELETE'])  # 특정 공지 신송 비공지화
@auth.login_required
def delete_notice_news(news_id):
	news = News.query.filter_by(id = news_id).first()
	if news is None:
		return not_found('News does not exist')
	if g.current_user.id != news.author_id:
		return forbidden('Cannot chang other user\'s news')
	news.notice = False
	db.session.commit()
	return jsonify(news.to_json())
