# -*- coding:utf-8 -*-
import os, time
from flask import request, jsonify, g, send_from_directory
from . import api
from authentication import auth 
from .. import db
from ..models import User, Comment, News, Group
from errors import not_found, forbidden, bad_request
from datetime import datetime

UPLOAD_FOLDER = os.path.join(api.root_path, '../../file/')
ALLOWED_PIC_EXTENSIONS = set(['png','jpg','jpeg','gif', 'bmp'])
ALLOWED_FILE_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'bmp',\
                    'show', 'cell', 'xls', 'xlsm', 'xlsx', 'csv', 'ppt',\
                    'pptx', 'doc', 'docx', 'hwp', 'pdf', 'txt'])

def allowed_file(filename):
    return '.' in filename and\
        filename.rsplit('.', 1)[1] in ALLOWED_FILE_EXTENSIONS

def allowed_picture(filename):
    return '.' in filename and\
        filename.rsplit('.', 1)[1] in ALLOWED_PIC_EXTENSIONS

def addTimestamp(filename):
    now = time.localtime()
    timestamp = "_%04d%02d%02d_%02d%02d%02d" %\
                (now.tm_year, now.tm_mon, now.tm_mday, now.tm_hour, now.tm_min, now.tm_sec)
    return filename.rsplit('.', 1)[0] + timestamp + "." + filename.rsplit('.', 1)[1]
    

@api.route('/news/<int:id>/file', methods=['GET'])  # 특정 신송 파일 요청
@auth.login_required
def get_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if news.group is not None and g.current_user not in news.house.users\
                    and g.current_user.id != news.house.create_user:
        return forbidden('User does not in this group')
    filelocate = news.filelocate
    if filelocate is None:
        return not_found('File does not exist')
    return send_from_directory(UPLOAD_FOLDER, filelocate)


@api.route('/news/<int:id>/file', methods=['POST'])  # 특정 신송 파일 추가
@auth.login_required
def post_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot Upload File')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')

    file = request.files['file']
    if file and allowed_file(file.filename.lower()):
        filename = file.filename
        filelocate = addTimestamp(filename)
        if len(filename.rsplit('.')) is not 2:
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        news.filename = filename
        news.filelocate = filelocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
    return jsonify(news.to_json())


@api.route('/news/<int:id>/file', methods=['PUT'])  # 특정 신송 파일 수정
@auth.login_required
def put_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot Upload File')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')
    os.remove(os.path.join(UPLOAD_FOLDER, news.filelocate))

    file = request.files['file']                             
    if file and allowed_file(file.filename.lower()):
        filename = file.filename
        filelocate = addTimestamp(filename)
        if len(filename.rsplit('.')) is not 2:
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        news.filename = filename
        news.filelocate = filelocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
    return jsonify(news.to_json())


@api.route('/news/<int:id>/file', methods=['DELETE'])  # 특정 신송 파일 삭제
@auth.login_required
def delete_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot Delete File')
    os.remove(os.path.join(UPLOAD_FOLDER, news.filelocate))
    news.filename = None
    news.filelocate = None
    db.session.commit()
    return '', 204 


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
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        comment.filename = filename
        comment.filelocate = filelocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
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
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, filelocate))
        comment.filename = filename
        comment.filelocate = filelocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
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
    db.session.commit()
    return '', 204 


@api.route('/users/<user_id>/picture', methods=['GET']) # 유저 프로필 사진 요청 
@auth.login_required
def get_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    pictureName = user.pictureName
    pictureLocate = user.pictureLocate
    if pictureLocate is None:
        return not_found('Picture does not exist')
    return send_from_directory(UPLOAD_FOLDER, pictureLocate)


@api.route('/users/<user_id>/picture', methods=['POST']) # 유저 프로필 사진 추가
@auth.login_required
def post_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    if g.current_user is not user:
        return forbidden('Cannot modify other user')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')
    file = request.files['file']
    if file and allowed_picture(file.filename.lower()):
        pictureName = file.filename
        pictureLocate = addTimestamp(pictureName)
        if len(pictureName.rsplit('.')) is not 2:
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, pictureLocate))
        user.pictureName = pictureName
        user.pictureLocate = pictureLocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
    return jsonify(user.to_json()), 200


@api.route('/users/<user_id>/picture', methods=['PUT']) # 유저 프로필 사진 수정
@auth.login_required
def put_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    if g.current_user is not user:
        return forbidden('Cannot modify other user')
    if request.files['file'] is None:
        return bad_request('File Request in invaild')
    os.remove(os.path.join(UPLOAD_FOLDER, user.pictureLocate))
    file = request.files['file']
    if file and allowed_picture(file.filename.lower()):
        pictureName = file.filename
        pictureLocate = addTimestamp(pictureName)
        if len(pictureName.rsplit('.')) is not 2:
            return bad_request('File have over once extension or no extension')

        file.save(os.path.join(UPLOAD_FOLDER, pictureLocate))
        user.pictureName = pictureName
        user.pictureLocate = pictureLocate
        db.session.commit()
    else: return bad_request('File have not allowed extension')
    return jsonify(user.to_json())


@api.route('/users/<user_id>/picture', methods=['DELETE']) # 유저 프로필 사진 삭제
@auth.login_required
def delete_user_picture(id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    if g.current_user is not user:
        return forbidden('Cannot modify other user')
    os.remove(os.path.join(UPLOAD_FOLDER, user.pictureLocate))
    user.pictureName = None
    user.pictureLocate = None
    db.session.commit()
    return '', 204
