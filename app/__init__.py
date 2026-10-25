# -*- coding: utf-8 -*-
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.cors import CORS

from .config import config

from flask_socketio import SocketIO

app = Flask(__name__)
db = SQLAlchemy()
socketio = SocketIO()

def create_app(config_name):
    # Do not enable wildcard CORS at application level.
    # The API blueprint alone may opt in to explicit trusted origins.
    selected = config[config_name]
    app.config.from_object(selected)
    selected.init_app(app)

    db.init_app(app) #For initialize DB
    socketio.init_app(app) #For initialize SocketIO app

    from .api_1_0 import api as api_1_0_blueprint
    app.register_blueprint(api_1_0_blueprint, url_prefix='/api/v1.0')
    # attach routes and custom error pages here

    """
    @app.route('/cert/<path:path>')
    def send_static(path):
    return send_from_direcatory('../static', path)
    """

    return app

