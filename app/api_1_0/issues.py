# -*- coding:utf-8 -*-
from flask import request, jsonify, url_for, make_response, g
from . import api
from authentication import auth
from pushes import sendIssuePush
from .. import db
from ..models import User, News, Issue
from errors import not_found, forbidden, bad_request
from datetime import datetime
from flask_cors import cross_origin


@api.route('/issues', methods=['GET'])
@auth.login_required
def get_all_issue():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pagination = Issue.query.filter_by(prev=None)\
            .order_by(Issue.id.desc()).paginate(page, per_page, error_out=False)
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
def post_ancestor():
    issue = Issue.from_json(request.json)
    issue.title = request.json.get('title')
    issue.solvers = []
    db.session.add(issue)
    db.session.commit()
    issue.ancestor = issue.id

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
    ancestor = Issue.query.get(issue_id)
    if ancestor is None:
        return not_found('Issue does not exist')
    prev = Issue.query.filter_by(ancestor=issue_id).order_by(Issue.id.desc()).first()

    if request.json.get('solvers') is None or request.json.get('solvers') == []:
        issue.solvers = prev.solvers

    news.group = None
    issue.ancestor = ancestor.id
    issue.prev = prev.id
    issue.news = news

    db.session.add(issue)
    db.session.commit()

    prev.next = issue.id
    news.notice = issue.id

    compareIssues(ancestor, issue) #상태 변경 시, system message 남기고 해당 이슈화
    resp = make_response()
    resp.headers['Location'] = url_for('api.get_issue', issue_id=issue.id)
    resp.status_code = 201
    return resp


@api.route('/issues/<issue_id>', methods=['DELETE'])
@auth.login_required
def delete_issue(issue_id):
    ancestor = Issue.query.filter_by(id=issue_id).first()
    ancestor_next = Issue.query.filter_by(prev=issue_id).first()
    if ancestor is None:
        return not_found('Issue does not exist')
    if ancestor_next is not None:
        if g.current_user.id != ancestor_next.news.author_id:
            return forbidden('Cannot delete other user\'s issue')

    issues = Issue.query.filter_by(ancestor=issue_id).all()
    for issue in issues:
        if issue.news is not None:
            db.session.delete(issue.news)
        db.session.delete(issue)
    db.session.commit()
    Issue.query.filter_by(ancestor=issue_id).delete()
    return '', 204


def compareIssues(ancestor, issue):
    #새 이슈와 더미 이슈 비교로 상태 전환 신송
    if issue.opening != ancestor.opening or list(issue.solvers) != list(ancestor.solvers):
        ancestor_next = Issue.query.filter_by(id=ancestor.next).first()
        # 상태 변화만 있는 경우
        if issue.opening != ancestor.opening and list(issue.solvers) == list(ancestor.solvers):
            if issue.opening:
                context = {"context": "#%r issue is opened." % ancestor_next.news.id}
                issue_data = {"opening": "True"}
                push_type = 6
            elif not issue.opening:
                context = {"context": "#%r issue is closed." % ancestor_next.news.id}
                issue_data = {"opening": "False"}
                push_type = 5
        # 해결자가 전환되는 경우
    elif issue.opening == ancestor.opening and list(issue.solvers) != list(ancestor.solvers):
        if ancestor.solvers == []: # 첫 이슈 등록 시
            context = {"context": "#%r issue's solvers have appointment." % ancestor_next.news.id}
            push_type = 4
        else:
            context = {"context": "#%r issue's solvers have changed." % ancestor_next.news.id}
            push_type = 7
            issue_data = {"opening": issue.opening, "solvers": "%r" % issue.solvers}
        # 상태 및 해결자 모두 변하는 경우
    else:
        if issue.opening:
            context = {"context": "#%r issue's opened and solvers have changed."\
                    % ancestor_next.news.id}
            issue_data = {"opening": "True", "solvers": "%r" % issue.solvers}
            push_type = 9
        elif not issue.opening:
            context = {"context": "#%r issue's closed and solvers have changed."\
                    % ancestor_next.news.id}
            issue_data = {"opening": False, "solvers": "%r" % issue.solvers}
            push_type = 8

        sendIssuePush(issue, push_type)
        system_news = News.from_json(context)
        system_news.author_id = g.current_user.id
        system_news.author_name = g.current_user.realname

        db.session.add(system_news)
        db.session.commit()

        prev = Issue.query.filter_by(ancestor=issue_id).order_by(Issue.id.desc()).first()
        system_issue = Issue.from_json(issue_data)
        if issue.opening:
            system_issue.closed_at = None
            ancestor.closed_at = None
            ancestor.opening = True
        elif not issue.opening:
            system_issue.closed_at = datetime.utcnow()
            ancestor.closed_at = system_issue.closed_at
            ancestor.opening = False
            ancestor.solvers = issue.solvers

            system_issue.ancestor = ancestor.id
            system_issue.prev = prev.id
            prev.next = system_issue.id
            system_issue.news = system_news
            system_issue.solvers = issue.solvers
            system_issue.opening = issue.opening
            system_issue.system_info = True

            db.session.add(system_issue)
            db.session.commit()

            issue.next_issue = system_issue.id
            system_issue.prev_issue = issue.id
            system_news.notice = system_issue.id

        else: pass
