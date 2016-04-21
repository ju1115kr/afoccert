# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, g, url_for
from . import api
from authentication import auth
from .. import db
from ..models import Tag
from errors import not_found, bad_request


# 전체 태그 요청
@api.route('/tags', methods=['GET'])
@auth.login_required
def get_all_tags():
    tags = Tag.query.order_by(Tag.name.asc()).all()
    if len(tags) == 0:
        return not_found('Tags does not exist')
    return jsonify({'tags': [tag.to_json() for tag in tags]})


# 특정 태그 요청
@api.route('/tags/<tag_name>', methods=['GET'])
@auth.login_required
def get_tag(tag_name):
    tag = Tag.query.filter_by(name=tag_name).first()
    if tag is None:
        return not_found('Tag does not exist')
    return jsonify(tag.to_json())


# 새로운 태그 추가
# TODO: 관리자급 계정만 가능하게
@api.route('/tags', methods=['POST'])
@auth.login_required
@cross_origin(expose_headers='Location')
def post_tag():
    if request.json is None:
        return bad_request('JSON Request is invaild')
    tag = Tag.from_json(request.json)
    if Tag.query.filter_by(name=tag.name).count() >= 1:
        return bad_request('Tag already existed' % tag.name)
    db.session.add(tag)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_tag', tag_name=tag.name)
    resp.status_code = 201
    return resp


# 기존 태그 수정
# TODO: 관리자급 계정만 가능하게
@api.route('/tags/<tag_name>', methods=['PUT'])
@auth.login_required
def put_tag(tag_name):
    if request.json is None:
        return bad_request('JSON Request is invaild')
    tag = Tag.query.filter_by(name=tag_name).first()
    if tag is None:
        return not_found('Tag does not exist')
    tag.name = request.json.get('name', tag.name)
    return jsonify(tag.to_json())


# 태그 삭제
# TODO: 관리자급 계정만 가능하게
@api.route('/tags/<tag_name>', methods=['DELETE'])
@auth.login_required
def delete_tag(tag_name):
    tag = Tag.query.filter_by(name=tag_name).first()
    if tag is None:
        return not_found('Tag does not exist')
    db.session.delete(tag)
    db.session.commit()
    return '', 204


# 특정 태그가 태깅된 모든 신송 요청
@api.route('/tags/<tag_name>/news', methods=['GET'])
@auth.login_required
def get_all_news_tagged(tag_name):
    if request.json is None:
        return bad_request('JSON Request is invaild')
    tag = Tag.query.filter_by(name=tag_name).first()
    if tag is None:
        return not_found('Tag does not exist')
    return jsonify({'tags': [news.to_json() for news in tag.news]})

