# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, g
from . import api
from authentication import auth
from .. import db


# 전체 태그 요청
@api.route('/tags', methods=['GET'])
@api.login_required
def get_all_tags():
    pass


# 새로운 태그 추가
# TODO: 관리자급 계정만 가능하게
@api.route('/tags', methods=['POST'])
@api.login_required
def post_tag():
    pass


# 기존 태그 수정
# TODO: 관리자급 계정만 가능하게
@api.route('/tags/<tag_name>', methods=['PUT'])
@auth.login_required
def put_tag(tag_name):
    pass


# 태그 삭제
# TODO: 관리자급 계정만 가능하게
@api.route('/tags/<tag_name>', methods=['DELETE'])
@auth.login_required
def delete_tag(tag_name):
    pass


# 특정 태그가 태깅된 모든 신송 요청
@api.route('/tags/<tag_name>/news', methods=['GET'])
@auth.login_required
def get_all_news_tagged(tag_name):
    pass
