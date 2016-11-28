# -*- coding:utf-8 -*-
from flask import request, jsonify, make_response, url_for, g, send_from_directory
from . import api
from authentication import auth
from .. import db
from ..models import News, User, Comment
from .search import removeEscapeChar
from errors import not_found, bad_request, forbidden
from flask.ext.cors import cross_origin
import os, time


UPLOAD_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../file/'))
ALLOWED_FILE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'bmp',\
                'show', 'cell', 'xls', 'xlsm', 'xlsx', 'csv', 'ppt',\
                'pptx', 'doc', 'docx', 'hwp', 'pdf', 'txt'])

def allowed_file(filename):
    return '.' in filename and\
        filename.rsplit('.', 1)[1] in ALLOWED_FILE_EXTENSIONS

def addTimestamp(filename):
    now = time.localtime()
    timestamp = "_%04d%02d%02d_%02d%02d%02d" %\
        (now.tm_year, now.tm_mon, now.tm_mday, now.tm_hour, now.tm_min, now.tm_sec)
    return filename.rsplit('.', 1)[0] + timestamp + "." + filename.rsplit('.', 1)[1]


@api.route('/comments/<int:comment_id>', methods=['GET'])  # 특정 덧글 요청
@auth.login_required
def get_comment(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    return jsonify(comment.to_json())


@api.route('/comments/<int:comment_id>/file', methods=['GET'])  # 특정 덧글 파일 요청
@auth.login_required
def get_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    filelocate = comment.filelocate
    if filelocate is None:
        return not_found('File does not exist')
    return send_from_directory(UPLOAD_FOLDER, filelocate)


@api.route('/comments/<int:comment_id>/file', methods=['POST'])  # 특정 덧글 파일 추가
@auth.login_required
def post_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:
        return forbidden('Cannot Upload File')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')

    file = request.files['file']
    if file and allowed_file(file.filename.lower()):
        filename = file.filename
        filelocate = addTimestamp(filename)
        if len(filename.rsplit('.')) is not 2:
            return bad_request('File have abnormal extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        comment.filename = filename
        comment.filelocate = filelocate
    return jsonify(comment.to_json())


@api.route('/comments/<int:comment_id>/file', methods=['PUT'])  # 특정 덧글 파일 수정
@auth.login_required                                   
def put_comment_file(comment_id):
    comment = Comment.query.gt(comment_id)             
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:
        return forbidden('Cannot Upload File')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')
    os.remove(os.path.join(UPLOAD_FOLDER, comment.filelocate))

    file = request.files['file']
    if file and allowed_file(file.filename.lower()):
        filename = file.filename
        filelocate = addTimestamp(filename)
        if len(filename.rsplit('.')) is not 2:
            return bad_request('File have abnormal extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        comment.filename = filename
        comment.filelocate = filelocate    
    return jsonify(comment.to_json())


@api.route('/comments/<int:comment_id>/file', methods=['DELETE'])  # 특정 덧글 파일 삭제
@auth.login_required
def delete_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:
        return forbidden('Cannot Delete File')
    os.remove(os.path.join(UPLOAD_FOLDER, comment.filelocate))
    comment.filename = None
    comment.filelocate = None
    return '', 204


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
    comment = Comment.query.filter_by(id=comment_id).first()
    if comment is None: # 덧글이 존재 하지 않을 경우
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:  # 다른 유저의 덧글을 수정하려고 하는 경우
        return forbidden('Cannot modify other user\'s comment')
    comment.context = request.json.get('context', comment.context)
    comment.parsed_context = removeEscapeChar(request.json.get('context', comment.context))
    comment.author_name = g.current_user.realname
    return jsonify(comment.to_json())


@api.route('/comments/<int:comment_id>', methods=['DELETE'])  # 특정 덧글 삭제
@auth.login_required
def delete_comment(comment_id):
    comment = Comment.query.filter_by(id=comment_id).first()
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:  # 다른 유저의 덧글을 삭제하려고 하는 경우
        return forbidden('Cannot delete other user\'s comment')
    if comment.filename is not None:
        os.remove(os.path.join(UPLOAD_FOLDER, comment.filelocate))
    Comment.query.filter(Comment.parent_id==comment.id).delete()
    db.session.delete(comment)
    db.session.commit()
    return '', 204
