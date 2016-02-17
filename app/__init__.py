# -*- coding:utf-8 -*-
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS

from .config import config

app = Flask(__name__, static_url_path='/static')
db = SQLAlchemy()


def create_app(config_name):
    CORS(app, expose_headers='Location')
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)
    # if config_name == 'development':  # 개발용 로컬 서버용 루틴(Front-end static 파일 핸들)
    #    import test
    from .api_1_0 import api as api_1_0_blueprint
    app.register_blueprint(api_1_0_blueprint, url_prefix='/api/v1.0')
    # attach routes and custom error pages here

    return app
