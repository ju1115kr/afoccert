# -*- coding: utf-8 -*-
"""Legacy Flask configuration. Never store production secrets in Git."""
import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config(object):
    # For local development, an ephemeral secret is safer than a committed key.
    # Production requires a persistent environment-provided secret.
    SECRET_KEY = os.environ.get('AFOCCERT_SECRET_KEY') or os.urandom(32)
    # Commit only after all authorization and validation checks pass.
    SQLALCHEMY_COMMIT_ON_TEARDOWN = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = os.environ.get('AFOCCERT_DEBUG') == '1'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'data-test.sqlite')


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('AFOCCERT_DATABASE_URL')

    @staticmethod
    def init_app(app):
        if not os.environ.get('AFOCCERT_SECRET_KEY'):
            raise RuntimeError('AFOCCERT_SECRET_KEY is required in production')
        if not os.environ.get('AFOCCERT_DATABASE_URL'):
            raise RuntimeError('AFOCCERT_DATABASE_URL is required in production')


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
