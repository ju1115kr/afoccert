# -*- coding: utf-8 -*-
from flask import request, jsonify, make_response, g, url_for
from flask.ext.cors import cross_origin
from authentication import auth
from . import api
from .. import db
from ..models import Group, User, News
from errors import not_found, forbidden, bad_request


@api.route('/groups', methods=['GET'])  # 전체 그룹 조회
@auth.login_required
def get_all_groups():
    groups = Group.query.order_by(Group.created_at.asc()).all()
    return jsonify({'groups':[group.to_json() for group in groups if g.current_user in group.users]})


@api.route('/groups/<group_name>', methods=['GET'])  # 특정 그룹 조회
@auth.login_required
def get_group(group_name):
    group = Group.query.filter_by(name = group_name).first()
    if group is None:
        return not_found('group does not exist')
    if g.current_user not in group.users:
        return forbidden('User does not in this group')
    return jsonify(group.to_json())


@api.route('/groups/<group_name>/news', methods=['GET'])  # 특정 그룹 내 신송 조회
@auth.login_required
def get_news_in_group(group_name):
    group = Group.query.filter_by(name = group_name).first()
    if group is None:
        return not_found('Group does not exist')
    if g.current_user not in group.users:
        return forbidden('User does not in this group')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = group.news.order_by(News.created_at.desc()).paginate(page, per_page, error_out=False)
    pag_news = pagination.items
    if pagination.total < 1:
        return not_found('News is not exist')
    return jsonify({'news' : [news.to_json() for news in pag_news]})


@api.route('/groups/<group_name>/users', methods=['GET'])  # 특정 그룹 내 이용자 조회
@auth.login_required
def get_users_in_group(group_name):
    users = Group.query.filter_by(name = group_name).first()\
            .users.all()
    if g.current_user not in users:
        return forbidden('User does not in this group')
    if users is None:
        return not_found('User in group is not exist')
    return jsonify({'users' :[user.to_json() for user in users]})


@api.route('/groups', methods=['POST'])  # 그룹 생성
@auth.login_required
@cross_origin(expose_headers='Location')
def post_group():
    group = Group.from_json(request.json)
    if Group.query.filter_by(name=group.name).count() != 0:
        db.session.rollback()
        return forbidden('Already name is exist')
    if request.json.get('users')==[] and not None:
        group.users = [ g. current_user ]
    db.session.add(group)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_group', group_name=group.name)  # 만들어진 그룹 URI 제공
    return resp


@api.route('/groups/<group_name>', methods=['PUT'])  # 그룹 수정
@auth.login_required
def put_group(group_name):
    old_group = Group.query.filter_by(name=group_name).first()
    if old_group is None:  # 그룹이 존재 하지 않을 경우
        return not_found('group does not exist')
    if request.json is None:  # 요청이 올바르지 않은 경우
        return bad_request('JSON request is invaild')
    if g.current_user not in Group.query.filter_by(name=group_name).first().users:
        return forbidden('User cannot modify group')

    name = request.json.get('name')
    description = request.json.get('description')
    users = request.json.get('users')
    user_list = [ str(user_name) for user_name in users.strip('[]').split(',') ]

    # 이름 수정 시 같은 이름이 존재하는 그룹이 있을 경우
    if group_name != name and Group.query.filter_by(name=name).count() >= 1:
        return forbidden('Group name is already exist')
    old_group.name = name
    old_group.description = description
    old_group.users = [ User.query.filter_by(username=user_name).first() for user_name in user_list\
					if User.query.filter_by(username=user_name).count() != 0 ]
    db.session.commit()
    return jsonify(old_group.to_json())


@api.route('/groups/<group_name>', methods=['DELETE'])  # 그룹 삭제
@auth.login_required
def delete_group(group_name):
    group = Group.query.filter_by(name=group_name).first()
    if group is None:
        return not_found('Group does not exist')
    if g.current_user not in group.users:
    	return forbidden('User does not in this group')
    # TODO: 삭제 불가능 그룹 리스트 관련 설계 재검토 필요
    if group.name == 'ADMIN_GROUP_NAME':  # 관리자 그룹 삭제 요청 시
        return forbidden('Cannot delete Administrator group')
    db.session.delete(group)
    db.session.commit()
    return '', 204


@api.route('/groups/<group_name>/notice', methods=['GET'])  # 특정 그룹 내 공지 신송 요청
@auth.login_required
def get_notice_group(group_name):
    group = Group.query.filter_by(name=group_name).first()
    if group is None:
        return not_found('Group does not exist')
    if g.current_user not in group.users:
        return forbidden('User does not in this group')

    notice = group.news.filter_by(notice=True).order_by(News.created_at.desc()).all()
    if notice is None:
        return not_found('Notice does not exist')
    return jsonify({'notice' : [news.to_json() for news in notice\
        if news.group is None or g.current_user in news.house.users]})
