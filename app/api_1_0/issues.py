# -*- coding:utf-8 -*-
from flask import request, jsonify, url_for, make_response, g
from . import api
from authentication import auth
from .. import db
from ..models import User, News, Issue
from errors import not_found, forbidden, bad_request
from datetime import datetime
from flask.ext.cors import cross_origin


@api.route('/issues', methods=['GET'])
@auth.login_required
def get_all_issue():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = Issue.query.filter_by(prev_issue=None)\
                    .order_by(Issue.created_at.desc()).paginate(page, per_page, error_out=False)
    pag_issues = pagination.items
    return jsonify({'issues': [issue.to_json() for issue in pag_issues]})


@api.route('/issues/<issue_id>', methods=['GET'])
@auth.login_required
def get_issue(issue_id):
    issue = Issue.query.get(issue_id)
    if issue is None:
        return not_found('Issue does not exist')
    return jsonify(issue.to_json())


@api.route('/news/<news_id>/issues', methods=['GET'])
@auth.login_required
def get_news_issue(news_id):
    news = News.query.get(news_id)
    if news is None:
        return not_found('News does not exist')
    issue = news.issue
    if issue is None:
        return not_found('Issue does not exist')    
    return jsonify(issue.to_json())


@api.route('/issues', methods=['POST'])
@auth.login_required
@cross_origin(expose_headers='Location')
def post_ancestor_issue():
    issue = Issue.from_json(request.json)
    if request.json.get('sovlers') is None or request.json.get('solvers') == []:
        issue.solvers = [ g.current_user ]
    db.session.add(issue)
    db.session.commit()
    issue.ancestor_issue = issue.id
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_issue', issue_id=issue.id)
    resp.status_code = 201
    return resp


@api.route('/issues/<issue_id>/news/<news_id>', methods=['POST'])
@auth.login_required
@cross_origin(expose_headers='Location')
def post_issue(news_id, issue_id):
    issue = Issue.from_json(request.json)
    news = News.query.get(news_id)
    if news is None:
        return not_found('News does not exist')
    if g.current_user.id != news.author_id:
        return forbidden('Cannot issue other user\'s news')
    if news.notice is not None:
        return forbidden('News already issued')
    ancestor_issue = Issue.query.get(issue_id)
    if ancestor_issue is None:
        return not_found('Issue does not exist')
    prev_issue = Issue.query.filter_by(ancestor_issue=issue_id).order_by(Issue.created_at.desc()).first()

    if request.json.get('sovlers') is None or request.json.get('solvers') == []:
        issue.solvers = [ g.current_user ]

    news.group = None
    issue.ancestor_issue = ancestor_issue.id
    issue.prev_issue = prev_issue.id
    issue.news = news

    if issue.opening != ancestor_issue.opening:
        if issue.opening == True:
            ancestor_issue.closed_at == None
        elif issue.opening == False:
            ancestor_issue.closed_at = datetime.utcnow()
        ancestor_issue.opening = issue.opening
    if issue.solvers != ancestor_issue.solvers:
        ancestor_issue.solvers = issue.solvers
    #TODO: 상태가 변경되면, system_info인 새로운 글을 남기고 이슈화해야함.

    db.session.add(issue)
    db.session.commit()
    prev_issue.next_issue = issue.id
    news.notice = issue.id
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_issue', issue_id=issue.id)
    resp.status_code = 201
    return resp


@api.route('/issues/<issue_id>', methods=['DELETE'])
@auth.login_required
def delete_issue(issue_id):
    ancestor_issue = Issue.query.filter_by(id=issue_id).first()
    ancestor_next_issue = Issue.query.filter_by(prev_issue=issue_id).first()
    if ancestor_issue is None:
        return not_found('Issue does not exist')
    if ancestor_next_issue is not None:
        if g.current_user.id != ancestor_next_issue.news.author_id:
            return forbidden('Cannot delete other user\'s issue')

    issues = Issue.query.filter_by(ancestor_issue=issue_id).all()
    for issue in issues:
        if issue.news is not None:
            db.session.delete(issue.news)
        db.session.delete(issue)
    return '', 204
