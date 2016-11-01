# -*- coding: utf-8 -*-
import os
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = '@n5nym0u$$c3rt0!88$M@rtC3rt' # Flask 기본값 사용
    SQLALCHEMY_COMMIT_ON_TEARDOWN = True
    
    ADMIN_USERNAME = u'root'  # 최고 관리자 계정(오직 1개) 아이디 이름
    ADMIN_REALNAME = u'관리자'  # 최고 관리자 계정 초기 실명
    ADMIN_PASSWORD = u'toor' # 최고 관리자 계정 초기 패스워드
    ADMIN_GROUP_NAME = u'Administrators'  # 최고 관리자 그룹 이름
    ADMIN_GROUP_DESCRIPTION = u'관리자 그룹' # 관리자 그룹 초기 기본 설명

    UPLOAD_FOLDER = basedir

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'data-test.sqlite')


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'mysql://afoccert:$M@rtC3rt@localhost/afoccert'


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,

#    'default': ProductionConfig  # 설정 변경 하는 곳
    'default': DevelopmentConfig
}
