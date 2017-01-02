# -*- coding: utf-8 -*-
import os
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = '@n5nym0u$$c3rt0!88$M@rtC3rt' # Flask 기본값 사용
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    
    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'data-test.sqlite')


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = 'mysql://afoccert:$M@rtC3rt@localhost/afoccert'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,

#    'default': ProductionConfig  # 설정 변경 하는 곳
    'default': DevelopmentConfig
}
