from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS

from .config import config

db = SQLAlchemy()


def create_app(config_name):
    app = Flask(__name__)
    CORS(app, expose_headers='Location')
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    db.init_app(app)

    from .api_1_0 import api as api_1_0_blueprint
    app.register_blueprint(api_1_0_blueprint, url_prefix='/api/v1.0')
    # attach routes and custom error pages here

    return app
