# -*- coding: utf-8 -*-
from flask import jsonify, g, request, current_app
from flask.ext.httpauth import HTTPBasicAuth
from . import api
from errors import unauthorized, not_found, bad_request
from ..models import User

auth = HTTPBasicAuth()

"""

@api.before_request
@auth.login_required
def before_request():
    if not g.current_user.confirmed:
        return forbidden('Unconfirmed account')

"""


@auth.verify_password
def verify_password(username_or_token, password):
    if username_or_token == '':  # TODO: 익명 로그인 허용시 구현될 부분
        return False
    if password == '':  # Token Authentication
        g.current_user = User.verify_auth_token(username_or_token)
        g.token_used = True
        return g.current_user is not None
    user = User.query.filter_by(username=username_or_token).first()
    if not user:
        return False
    g.current_user = user
    g.token_used = False
    return user.verify_password(password)


@api.route('/token', methods=['GET'])
@auth.login_required
def get_token():
    # res = verify_password(request.json.get('id'), request.json.get('pw'))
    # print res
    # if res:
    if g.token_used:
        return bad_request('token is already given')
    return jsonify({'token': g.current_user.generate_auth_token(g.current_user, expiration=3600),
                    'expiration': 3600}), 200
    # elif res is False:
    #    return bad_request('Invaild ID or Password')
    # else:
    #     return not_found()

"""
@api.route('/tokens', methods=['DELETE'])
def delete_token():
pass
"""





    
