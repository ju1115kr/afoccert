# -*- coding: utf-8 -*-
from flask import request, jsonify, make_response, g, url_for
from authentication import auth
from . import api
from .access import can_read_group, can_read_news
from .. import db
from ..models import Group, User, News
from errors import not_found, forbidden, bad_request

try:
    string_types = (basestring,)
except NameError:  # For source-level checks with modern Python
    string_types = (str,)


def valid_usernames(users):
    return (isinstance(users, list) and
            all(isinstance(name, string_types) and name for name in users))


@api.route('/groups', methods=['GET'])  # 전체 그룹 조회
@auth.login_required
def get_all_groups():
    groups = Group.query.order_by(Group.created_at.asc()).all()
    return jsonify({'groups':[group.to_json() for group in groups if g.current_user.id == group.create_user]})


@api.route('/groups/<int:group_id>', methods=['GET'])  # 특정 그룹 조회
@auth.login_required
def get_group(group_id):
    group = Group.query.get(group_id)
    if group is None:
        return not_found('group does not exist')
    if g.current_user.id != group.create_user:
        return forbidden('User does not create this group')
    return jsonify(group.to_json())


@api.route('/groups/<int:group_id>/news', methods=['GET'])  # 특정 그룹 내 신송 조회
@auth.login_required
def get_news_in_group(group_id):
    group = Group.query.get(group_id)
    if group is None:
        return not_found('Group does not exist')
    if not can_read_group(group, g.current_user):
        return forbidden('User does not in this group')

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = group.news.order_by(News.created_at.desc()).paginate(page, per_page, error_out=False)
    pag_news = pagination.items
    if pagination.total < 1:
        return not_found('News is not exist')
    return jsonify({'news' : [news.to_json() for news in pag_news]})


@api.route('/groups/<int:group_id>/users', methods=['GET'])  # 특정 그룹 내 이용자 조회
@auth.login_required
def get_users_in_group(group_id):
    group = Group.query.get(group_id)
    if group is None:
        return not_found('Group does not exist')
    if g.current_user.id != group.create_user:
        return forbidden('User does not create this group')
    users = group.users.all()
    return jsonify({'users' :[user.to_json() for user in users]})


@api.route('/groups', methods=['POST'])  # 그룹 생성
@auth.login_required
def post_group():
    if request.json is None or not isinstance(request.json, dict):
        return bad_request('JSON request is invalid')
    if (request.json.get('users') is not None and
            not valid_usernames(request.json['users'])):
        return bad_request('users must be a list')
    group = Group.from_json(request.json)
    if request.json.get('users') is None or request.json.get('users') == []:
        group.users = [ g.current_user ]
    group.create_user = g.current_user.id
    if Group.query.filter(Group.create_user == g.current_user.id)\
                    .filter(Group.name == group.name).count() >= 1:
        return bad_request('Group name already exist in same user.')
    db.session.add(group)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_group', group_id=group.id)  # 만들어진 그룹 URI 제공
    return resp


@api.route('/groups/<int:group_id>', methods=['PUT'])  # 그룹 수정
@auth.login_required
def put_group(group_id):
    old_group = Group.query.get(group_id)
    if old_group is None:  # 그룹이 존재 하지 않을 경우
        return not_found('group does not exist')
    if request.json is None:  # 요청이 올바르지 않은 경우
        return bad_request('JSON request is invaild')
    if g.current_user.id != old_group.create_user:
        return forbidden('User cannot modify group')

    name = request.json.get('name', old_group.name)
    description = request.json.get('description', old_group.description)
    users = request.json.get('users')
    if not isinstance(name, string_types) or not name.strip():
        return bad_request('Group name is required')
    if users is not None and not valid_usernames(users):
        return bad_request('users must be a list')

    if users is not None:
        # Query each named user at most once, preserving the requested order.
        members = []
        seen = set()
        for username in users:
            if username in seen:
                continue
            seen.add(username)
            member = User.query.filter_by(username=username).first()
            if member is not None:
                members.append(member)
        old_group.users = members if users else [g.current_user]
    old_group.name = name
    old_group.description = description
    db.session.commit()
    return jsonify(old_group.to_json())


@api.route('/groups/<int:group_id>', methods=['DELETE'])  # 그룹 삭제
@auth.login_required
def delete_group(group_id):
    group = Group.query.get(group_id)
    if group is None:
        return not_found('Group does not exist')
    if g.current_user.id != group.create_user:
    	return forbidden('User does not in this group')
    db.session.delete(group)
    db.session.commit()
    return '', 204


@api.route('/groups/<int:group_id>/notice', methods=['GET'])  # 특정 그룹 내 공지 신송 요청
@auth.login_required
def get_notice_group(group_id):
    group = Group.query.get(group_id)
    if group is None:
        return not_found('Group does not exist')
    if not can_read_group(group, g.current_user):
        return forbidden('User does not in this group')

    notice = group.news.filter_by(notice=True).order_by(News.created_at.desc()).all()
    return jsonify({'notice' : [news.to_json() for news in notice if can_read_news(news, g.current_user)]})
