# -*- coding:utf-8 -*-
from flask import request, jsonify, url_for, make_response, g
from . import api
from authentication import auth 
from .. import db
from ..models import User, News, Comment, Push
from errors import not_found, forbidden, bad_request
from datetime import datetime
from flask.ext.cors import cross_origin


@api.route('/pushes', methods=['GET'])
@auth.login_required
def get_all_push():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = Push.query.filter(Push.to_user==g.current_user.id)\
                    .order_by(Push.created_at.desc()).paginate(page, per_page, error_out=False)
    pag_pushes = pagination.items
    return jsonify({'pushes': [push.to_json() for push in pag_pushes if g.current_user in push.receivers]})


@api.route('/pushes/<push_id>', methods=['GET'])
@auth.login_required
def get_push(push_id):
    push = Push.query.get(push_id)
    if push is None:
        return not_found('Push does not exist')
    if g.current_user.id != push.to_user:
        return forbidden('User does not get this push')
    push.confirmed_at = datetime.utcnow()
    return jsonify(push.to_json())


@api.route('/pushes', methods=['POST'])
@auth.login_required
def post_push():
    push = Push.from_json(request.json)
    if push.receivers is None or push.receivers == []:
        return bad_request('Push have not receivers')
    for user in push.receivers:
        push.to_user = user.id
        db.session.add(push)
        user.uncfm_push = Push.query.filter(Push.to_user==user.id)\
            .filter(Push.confirmed_at==None).count()
    db.session.commit()
    resp = make_response()
    resp.status_code = 201
    return resp


def sendNewsPush(news, typenum):
    if news.tags is not None and news.tags != []:
        push_data = {"typenum":typenum, "news_id":news.id}
        push = Push.from_json(push_data)
        push.receivers = news.tags
        for user in push.receivers:
            push.to_user = user.id
            db.session.add(push)
            user.uncfm_push = Push.query.filter(Push.to_user==user.id)\
                .filter(Push.confirmed_at==None).count()
    db.session.commit()

def sendCommentPush(comment, typenum):
    if comment.tags is not None and comment.tags != []:
        push_data = {"typenum":typenum, "news_id":comment.news_id, "comment_id":comment.id}
        push = Push.from_json(push_data)
        push.receivers = comment.tags
        for user in push.receivers:
            push.to_user = user.id
            db.session.add(push)
            user.uncfm_push = Push.query.filter(Push.to_user==user.id)\
                .filter(Push.confirmed_at==None).count()
    db.session.commit()

def sendIssuePush(issue, typenum):
    if issue.solvers is not None and issue.solvers != []:
        push_data = {"typenum":typenum, "news_id":issue.news.id}
        push = Push.from_json(push_data)
        push.receivers = issue.solvers
        for user in push.receivers:
            push.to_user = user.id
            db.session.add(push)
            user.uncfm_push = Push.query.filter(Push.to_user==user.id)\
                .filter(Push.confirmed_at==None).count()
    db.session.commit()
