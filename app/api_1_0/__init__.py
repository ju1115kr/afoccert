# -*- coding: utf-8 -*-
from flask import Blueprint
from flask.ext.cors import CORS

# Flask Blueprint 정의
api = Blueprint('api', __name__)
# Only explicitly configured browser origins may read authenticated APIs.
# Same-origin deployments do not require CORS.
import os
allowed_origins = [origin.strip() for origin in
                   os.environ.get('AFOCCERT_CORS_ORIGINS', '').split(',')
                   if origin.strip()]
if allowed_origins:
    CORS(api, origins=allowed_origins)

# 어플리케이션 모듈들 임포트(여기서 api 구현들을 import 해줘야 flask app context 에 포함됨)
from . import authentication, news, users, comments, errors, search, groups, notice, files
