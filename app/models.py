# -*- coding: utf-8 -*-
import json
from flask import url_for, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from . import db
from app.exceptions import ValidationError
from datetime import datetime

# 태그-신송 간 Many-to-Many 관계 테이블
news_tag_relationship = db.Table('tag_relationship',
                                 db.Column('news_id', db.Integer, db.ForeignKey('news.id'), nullable=False),
                                 db.Column('tags_id', db.Integer, db.ForeignKey('tags.id'), nullable=False),
                                 db.PrimaryKeyConstraint('news_id', 'tags_id'))

# 유저-역할 간 Many-to-Many 관계 테이블
user_role_relationship = db.Table('role_relationship',
                                  db.Column('user_id', db.Integer, db.ForeignKey('users.id'), nullable=False),
                                  db.Column('role_id', db.Integer, db.ForeignKey('roles.id'), nullable=False),
                                  db.PrimaryKeyConstraint('user_id', 'role_id'))


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    realname = db.Column(db.Text)
    password_hash = db.Column(db.String(128))
    confirmed = db.Column(db.Boolean)

    roles = db.relationship('Role', secondary=user_role_relationship)
    news = db.relationship('News', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')

    def __init__(self, username, realname, password):
        self.username = username
        self.realname = realname
        self.password = password

    def __repr__(self):
        return '<User %r[%r]>' % (self.username, self.realname)
    
    @property
    def password(self):  # password 맴버 변수 직접 접근 차단
        raise AttributeError('password is not a readable attrubute')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def generate_auth_token(self, expiration):
        s = Serializer(current_app.config['SECRET_KEY'],
                       expires_in=expiration)
        return s.dumps({'id': self.id})

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(current_app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except:
            return None
        return User.query.get(data['id'])
        
    def to_json(self):  # json 출력 루틴
        json_user = {
            'id': self.id,
            'username': self.username,
            'realname': self.realname
        }
        return json_user
    
    @staticmethod
    def from_json(json_user):  # json 입력 루틴
        user_id = json_user.get('id')
        user_pw = json_user.get('pw')
        user_name = json_user.get('name')
        
        if user_id is None or user_id == '':
            raise ValidationError('user does not have a id')
        elif user_pw is None or user_pw == '':
            raise ValidationError('user does not have a pw')
        elif user_name is None or user_name == '':
            raise ValidationError('user does not have a name')
        
        return User(username=user_id, realname=user_name, password=user_pw)
    
    @staticmethod
    def generate_fake(count=100):  # 개발용 fake data 생성 루틴
        from sqlalchemy.exc import IntegrityError
        from random import seed
        import forgery_py

        seed()
        for i in range(count):
            u = User(username=forgery_py.internet.user_name(True),
                     password=forgery_py.lorem_ipsum.word(),
                     realname=forgery_py.name.full_name())
            db.session.add(u)
            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, index=True)
    description = db.Column(db.Text)

    users = db.relationship('User', secondary=user_role_relationship)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Role [%r](%r):%r>' % self.id, self.name, self.description
            

class News(db.Model):
    __tablename__ = 'news'
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    author_name = db.Column(db.Text())
    context = db.Column(db.Text, nullable=False)
    parsed_context = db.Column(db.Text)
    created_at = db.Column(db.DateTime, index=True,
                           default=datetime.utcnow)
    modified_at = db.Column(db.DateTime)
    parent_id = db.Column(db.Integer)

    permission = db.Column(db.PickleType)  # 신송의 공개범위 Permission 객체 저장용 컬럼 
    tags = db.relationship('Tag', secondary=news_tag_relationship)
    comments = db.relationship('Comment', backref='news', lazy='dynamic')

    def __init__(self, context, author=None):
        self.context = context
        if author is not None:
            self.author_name = author.realname
            self.author_id = author.id
    
    def __repr__(self):
        return '<News [%r](%r):%r>' % (self.created_at, self.author_name, self.context)

    def to_json(self):  # json 출력 루틴
        json_news = {
            # 'url': url_for('api.get_news', _external=True),
            'id': self.id,
            'author': self.author.username,
            'author_name': self.author_name,
            'context': self.context,
            'created_at': self.created_at,
            'modified_at': self.modified_at,
            'tags': [tag.to_json() for tag in self.tags]
        }
        return json_news

    @staticmethod
    def from_json(json_news):  # json 입력 루틴
        context = json_news.get('context')
        tags = json_news.get('tags')
        #        for role in json_news.get('permission').get('roles'):  # TODO: 권한 시스템 구현 예정
            
        # author = g.current_user
        if context is None or context == '':
            raise ValidationError('news does not have a context')
        tag_names = [tag.get('name') for tag in tags]
        if len(tag_names) != len(list(set(tag_names))):  # 중복된 태그가 태깅되었을 경우(같은 태그가 2개 이상)
            raise ValidationError('tag\'s name confilct in tags')
        news = News(context=context)
        if type(tags) == list and tags is not None and len(tags) >= 1:  # 신송에 태깅된 태그가 존재 한다면
            news.tags = [Tag.query.filter_by(name=tag.get('name')).first() for tag in tags  # 실제로 존재하는 태그에 대하여만 신송에 태깅
                         if Tag.query.filter_by(name=tag.get('name')).count() != 0]
        return news

    @staticmethod
    def generate_fake(count=100):  # 개발용 fake data 생성 루틴
        from random import seed, randint
        import forgery_py

        seed()
        user_count = User.query.count()
        for i in range(count):
            u = User.query.offset(randint(0, user_count - 1)).first()
            p = News(context=forgery_py.lorem_ipsum.sentences(randint(1, 3)),
                     created_at=forgery_py.date.date(True),
                     author=u)
            db.session.add(p)
            db.session.commit()
                     

class Comment(db.Model):
    __tablename__ = 'comments'
    id = db.Column(db.Integer, primary_key=True)
    context = db.Column(db.Text)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    author_name = db.Column(db.String(64))
    news_id = db.Column(db.Integer, db.ForeignKey('news.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))
    comments = db.relationship('Comment', lazy='dynamic')

    def __init__(self, context, news_id=None):
        self.context = context
        self.news_id = news_id

    def __repr__(self):
        return '<Comment #%r[%r]: %r>' % (self.news_id, self.author_name, self.context)

    @staticmethod
    def from_json(json_comment):  # json 입력 루틴
        context = json_comment.get('context')
        if context is None or context == '':
            raise ValidationError('comment does not have a context')
        return Comment(context=context)
    
    def to_json(self):  # json 출력 루틴
        json_comment = {
            #'url': url_for('api.get_comment', _external=True),
            'id': self.id,
            'author': self.author.username,
            'author_name': self.author_name,
            'context': self.context,
            'created_at': self.created_at,
            'news_id': self.news_id,
            'parent_id': self.parent_id,
            'count_reply': self.comments.count()
        }
        return json_comment

    @staticmethod
    def generate_fake(count=300):  # 개발용 fake data 생성 루틴
        from random import seed, randint
        import forgery_py

        seed()
        user_count = User.query.count()
        news_count = News.query.count()
        for i in range(count):
            u = User.query.offset(randint(0, user_count - 1)).first()
            n = News.query.offset(randint(0, news_count - 1)).first()
            c = Comment(context=forgery_py.lorem_ipsum.sentences(randint(1, 3)), news_id=n.id,
                        created_at=forgery_py.date.date(True), author=u)
            c.author_name = u.realname
            db.session.add(c)
            db.session.commit()


class Tag(db.Model):
    __tablename__ = 'tags'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    # news = db.relationship('News', backref='tag', lazy='dynamic')
    news = db.relationship('News', secondary=news_tag_relationship)

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return '<Tag [%r]>' % self.name

    def to_json(self):
        json_tag = {
            'id': self.id,
            'name': self.name
        }
        return json_tag

    @staticmethod
    def from_json(json_tag):
        name = json_tag.get('name')
        if name is None or name == '':
            raise ValidationError('tag does not have a name')
        return Tag(name=name)

"""
class Push(db.Model):
    __tablename__ = 'pushs'
    id = db.Column(db.Integer, primary_key=True)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    uri = db.Column(db.Text)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, index=True,
                           default=datetime.utcnow)

    def __init__(self, author_id, message):
        self.author_id = author_id
        self.message = message
    
    def __repr__(self):
        return '<Push [%r]:%r>' %\
            (self.author_id, self.message)
"""
