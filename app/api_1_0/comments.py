# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, url_for, g, send_from_directory
from . import api
from authentication import auth
from .. import db
from ..models import News, User, Comment
from errors import not_found, bad_request, forbidden
from flask.ext.cors import cross_origin
import os

@api.route('/comments/<int:comment_id>', methods=['GET'])  # 특정 덧글 요청
@auth.login_required
def get_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    return jsonify(comment.to_json())


@api.route('/comments/<int:comment_id>/comments', methods=['GET'])  # 특정 덧글의 답글 요청
@auth.login_required
def get_comments_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    return jsonify({'reply_comments': [reply_comment.to_json() for reply_comment in comment.comments]})


@api.route('/comments/<int:comment_id>', methods=['POST'])  # 특정 덧글의 답글 작성
@auth.login_required
@cross_origin(expose_headers='Location')
def post_comments_comment(comment_id):
    if request.json is None:
        return bad_request('JSON Request is invaild')
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    reply_comment = Comment.from_json(request.json)
    reply_comment.news_id = comment.news_id
    reply_comment.parent_id = comment.id
    reply_comment.author_id = g.current_user.id
    reply_comment.author_name = g.current_user.realname
    db.session.add(reply_comment)
    db.session.commit()
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_comment', comment_id=reply_comment.id)
    resp.status_code = 201
    return resp


@api.route('/comments/<int:comment_id>', methods=['PUT'])  # 특정 덧글 수정
@auth.login_required
def put_comment(comment_id):
    if request.json is None:  # 요청이 올바르지 않은 경우 - 덧글의 내용이 없다던가
        return bad_request('JSON Request is invaild')
    old_comment = Comment.query.filter_by(id=comment_id).first()
    if old_comment is None: # 덧글이 존재 하지 않을 경우
        return not_found('Comment does not exist')
    if g.current_user.id != old_comment.author_id:  # 다른 유저의 덧글을 수정하려고 하는 경우
        return forbidden('Cannot modify other user\'s comment')
    comment = Comment.from_json(request.json)
    old_comment.context = comment.context
    old_comment.parsed_context = comment.parsed_context
    old_comment.author_name = g.current_user.realname
    return jsonify(old_comment.to_json())


@api.route('/comments/<int:comment_id>', methods=['DELETE'])  # 특정 덧글 삭제
@auth.login_required
def delete_comment(comment_id):
    comment = Comment.query.filter_by(id=comment_id).first()
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:  # 다른 유저의 덧글을 삭제하려고 하는 경우
        return forbidden('Cannot delete other user\'s comment')
    if comment.filename is not None:
        os.remove(os.path.join(api.root_path, '../../file/', comment.filelocate))
    Comment.query.filter(Comment.parent_id==comment.id).delete()
    db.session.delete(comment)
    db.session.commit()
    return '', 204
