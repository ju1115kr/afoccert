# -*- coding: utf-8 -*-
from flask import Blueprint
from flask.ext.cors import CORS

# Flask Blueprint 정의
api = Blueprint('api', __name__)
CORS(api)  # enable CORS on the API_v1.0 blueprint

# 어플리케이션 모듈들 임포트(여기서 api 구현들을 import 해줘야 flask app context 에 포함됨)
from . import authentication, news, users, comments, errors, search, logincheck, groups, notice, chat_example
#, permission, tag
