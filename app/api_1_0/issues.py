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


@api.route('/issues/<issue_id>/news', methods=['GET'])
@auth.login_required
def get_issue_news(issue_id):
    issue = Issue.query.get(issue_id)
    if issue is None:
        return not_found('Issue does not exist')
    news = issue.news
    if news is None:
        return not_found('News does not exist')
    return jsonify(news.to_json())


@api.route('/issues', methods=['POST'])
@auth.login_required
@cross_origin(expose_headers='Location')
def post_ancestor_issue():
    issue = Issue.from_json(request.json)
    if request.json.get('solvers') is None or request.json.get('solvers') == []:
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

    if request.json.get('solvers') is None or request.json.get('solvers') == []:
        issue.solvers = [ g.current_user ]

    news.group = None
    issue.ancestor_issue = ancestor_issue.id
    issue.prev_issue = prev_issue.id
    issue.news = news

    db.session.add(issue)
    db.session.commit()
    prev_issue.next_issue = issue.id
    news.notice = issue.id

    #상태가 변경되면, system_info인 새로운 글을 남기고 이슈화
    make_SystemInfo(ancestor_issue, issue)

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
    db.session.commit()
    Issue.query.filter_by(ancestor_issue=issue_id).delete()
    return '', 204


def make_SystemInfo(ancestor_issue, issue):
    if (issue.opening != ancestor_issue.opening) or (issue.solvers != ancestor_issue.solvers):
        ancestor_next_issue = Issue.query.filter_by(id=ancestor_issue.next_issue).first()
        if (issue.opening != ancestor_issue.opening) and (issue.solvers == ancestor_issue.solvers):
            if issue.opening == True:
                context = {"context":"#%r issue is opened." % ancestor_next_issue.news.id}
                issue_data = {"opening":"True"}
            elif issue.opening == False:
                context = {"context":"#%r issue is closed." % ancestor_next_issue.news.id}
                issue_data = {"opening":"False"}
        elif (issue.opening == ancestor_issue.opening) and (issue.solvers != ancestor_issue.solvers):
            context = {"context":"#%r issue's solvers have changed." % ancestor_next_issue.news.id}
            issue_data = {"opening":issue.opening, "solvers":"%r" % issue.solvers}

        elif (issue.opening != ancestor_issue.opening) and (issue.solvers != ancestor_issue.solvers):
            if issue.opening == True:
                context = {"context":"#%r issue's opened and solvers have changed."\
                                % ancestor_next_issue.news.id}
                issue_data = {"opening":"True", "solvers":"%r" % issue.solvers}
            elif issue.opening == False:
                context = {"context":"#%r issue's closed and solvers have changed."\
                                % ancestor_next_issue.news.id}
            issue_data = {"opening":False, "solvers":"%r" % issue.solvers}

        system_news = News.from_json(context)
        system_news.author_id = g.current_user.id
        system_news.author_name = g.current_user.realname
        db.session.add(system_news)
        db.session.commit()
   
        system_issue = Issue.from_json(issue_data)
        if issue.opening == True:
            system_issue.closed_at = None
            ancestor_issue.closed_at = None
            ancestor_issue.opening = True
        elif issue.opening == False:
            system_issue.closed_at = datetime.utcnow()
            ancestor_issue.closed_at = system_issue.closed_at
            ancestor_issue.opening = False

        system_issue.ancestor_issue = ancestor_issue.id
        system_issue.news = system_news
        system_issue.solvers = issue.solvers
        system_issue.opening = issue.opening
        system_issue.system_info = True
        db.session.add(system_issue)
        db.session.commit()

        issue.next_issue = system_issue.id
        system_issue.prev_issue = issue.id
        system_news.notice = system_issue.id
