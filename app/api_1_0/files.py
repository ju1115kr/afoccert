# -*- coding: utf-8 -*-
"""Authenticated attachment handling for the legacy AFOCCERT API.

Server filenames are random and never derived from untrusted upload paths.
Existing attachment names are accepted only if they are safe basenames.
"""
import os
import uuid

from flask import g, jsonify, request, send_from_directory

from . import api
from .access import can_read_comment, can_read_news
from authentication import auth
from .. import db
from ..models import User, Comment, News
from errors import not_found, forbidden, bad_request


UPLOAD_FOLDER = os.path.abspath(os.path.join(api.root_path, '../../file'))
ALLOWED_PIC_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'bmp'])
ALLOWED_FILE_EXTENSIONS = set([
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'show', 'cell',
    'xls', 'xlsm', 'xlsx', 'csv', 'ppt', 'pptx', 'doc',
    'docx', 'hwp', 'pdf', 'txt'
])


def _extension(filename):
    if not filename or '.' not in filename:
        return None
    return filename.rsplit('.', 1)[1].lower()


def allowed_file(filename):
    return _extension(filename) in ALLOWED_FILE_EXTENSIONS


def allowed_picture(filename):
    return _extension(filename) in ALLOWED_PIC_EXTENSIONS


def _safe_stored_path(filename):
    if (not filename or filename in ('.', '..') or
            os.path.basename(filename) != filename or
            '/' in filename or '\\' in filename):
        return None
    return os.path.join(UPLOAD_FOLDER, filename)


def _send_attachment(filename, as_attachment=True):
    path = _safe_stored_path(filename)
    if path is None or not os.path.isfile(path):
        return not_found('File does not exist')
    return send_from_directory(UPLOAD_FOLDER, filename,
                               as_attachment=as_attachment)


def _remove_attachment(filename):
    path = _safe_stored_path(filename)
    if path is not None and os.path.isfile(path):
        os.remove(path)


def _upload(is_picture=False):
    uploaded = request.files.get('file')
    if uploaded is None or not uploaded.filename:
        return None
    original_name = uploaded.filename
    extension = _extension(original_name)
    extensions = ALLOWED_PIC_EXTENSIONS if is_picture else ALLOWED_FILE_EXTENSIONS
    if extension not in extensions:
        return None
    # Preserve the display name in the database; never use it as a disk path.
    stored_name = uuid.uuid4().hex + '.' + extension
    uploaded.save(os.path.join(UPLOAD_FOLDER, stored_name))
    return original_name, stored_name


def _update_attachment(resource, is_picture=False):
    saved = _upload(is_picture)
    if saved is None:
        return bad_request('Missing file or unsupported file extension')
    if is_picture:
        previous = resource.pictureLocate
        resource.pictureName, resource.pictureLocate = saved
    else:
        previous = resource.filelocate
        resource.filename, resource.filelocate = saved
    db.session.commit()
    if previous != saved[1]:
        _remove_attachment(previous)
    return jsonify(resource.to_json())


def _delete_attachment(resource, is_picture=False):
    if is_picture:
        previous = resource.pictureLocate
        resource.pictureName = None
        resource.pictureLocate = None
    else:
        previous = resource.filelocate
        resource.filename = None
        resource.filelocate = None
    db.session.commit()
    _remove_attachment(previous)
    return '', 204


@api.route('/news/<int:id>/file', methods=['GET'])
@auth.login_required
def get_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if not can_read_news(news, g.current_user):
        return forbidden('Cannot access this group')
    return _send_attachment(news.filelocate)


@api.route('/news/<int:id>/file', methods=['POST'])
@auth.login_required
def post_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot upload file')
    return _update_attachment(news)


@api.route('/news/<int:id>/file', methods=['PUT'])
@auth.login_required
def put_news_file(id):
    return post_news_file(id)


@api.route('/news/<int:id>/file', methods=['DELETE'])
@auth.login_required
def delete_news_file(id):
    news = News.query.get(id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot delete file')
    return _delete_attachment(news)


@api.route('/comments/<int:comment_id>/file', methods=['GET'])
@auth.login_required
def get_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    if not can_read_comment(comment, g.current_user):
        return forbidden('Cannot access this group')
    return _send_attachment(comment.filelocate)


@api.route('/comments/<int:comment_id>/file', methods=['POST'])
@auth.login_required
def post_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:
        return forbidden('Cannot upload file')
    return _update_attachment(comment)


@api.route('/comments/<int:comment_id>/file', methods=['PUT'])
@auth.login_required
def put_comment_file(comment_id):
    return post_comment_file(comment_id)


@api.route('/comments/<int:comment_id>/file', methods=['DELETE'])
@auth.login_required
def delete_comment_file(comment_id):
    comment = Comment.query.get(comment_id)
    if comment is None:
        return not_found('Comment does not exist')
    if g.current_user.id != comment.author_id:
        return forbidden('Cannot delete file')
    return _delete_attachment(comment)


@api.route('/users/<user_id>/picture', methods=['GET'])
@auth.login_required
def get_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    return _send_attachment(user.pictureLocate, as_attachment=False)


@api.route('/users/<user_id>/picture', methods=['POST'])
@auth.login_required
def post_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    if g.current_user.id != user.id:
        return forbidden('Cannot modify other user')
    return _update_attachment(user, is_picture=True)


@api.route('/users/<user_id>/picture', methods=['PUT'])
@auth.login_required
def put_user_picture(user_id):
    return post_user_picture(user_id)


@api.route('/users/<user_id>/picture', methods=['DELETE'])
@auth.login_required
def delete_user_picture(user_id):
    user = User.query.filter_by(username=user_id).first()
    if user is None:
        return not_found('User does not exist')
    if g.current_user.id != user.id:
        return forbidden('Cannot modify other user')
    return _delete_attachment(user, is_picture=True)
