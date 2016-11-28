# -*- coding: utf-8 -*-
from flask import url_for, current_app, g
from werkzeug import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import TimedJSONWebSignatureSerializer as Serializer
from . import db
from app.exceptions import ValidationError
from datetime import datetime 


# 유저-그룹 간 Many-to-Many 관계 테이블
user_group_relationship = db.Table('user_group_relationship',
                                  db.Column('user_id', db.Integer, db.ForeignKey('users.id'), nullable=False),
                                  db.Column('group_id', db.Integer, db.ForeignKey('groups.id'), nullable=False),
                                  db.PrimaryKeyConstraint('user_id', 'group_id'))


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    realname = db.Column(db.Text)
    password_hash = db.Column(db.String(128))
    confirmed = db.Column(db.Boolean)
    pictureName = db.Column(db.Text)
    pictureLocate = db.Column(db.Text)

    groups = db.relationship('Group',
                    secondary=user_group_relationship, 
                    backref=db.backref('user', lazy='dynamic'),
                    lazy='dynamic')

    groups = db.relationship('Group', 
                    secondary=user_group_relationship, 
                    backref=db.backref('user', lazy='dynamic'),
                    lazy='dynamic')

    news = db.relationship('News', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    create_group = db.relationship('Group', backref='author', lazy='dynamic')
    recent_group = db.Column(db.Integer)

    def __init__(self, username, realname, password):
        self.username = username
        self.realname = realname
        self.password = password

    def __repr__(self):
        return '<User %r[%r]>' % (self.username, self.realname)
    
    @property
    def password(self):  # password 맴버 변수 직접 접근 차단
        raise AttributeError('password is not a readable attrubute')

    @property
    def is_authenticated(self):
        return True

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
            'realname': self.realname,
	        'picture' : self.pictureName,
            'recent_group' : self.recent_group
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


class Group(db.Model):
    __tablename__ = 'groups'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    create_user = db.Column(db.Integer, db.ForeignKey('users.id'))

    users = db.relationship('User', 
                    secondary=user_group_relationship, 
                    passive_deletes=True,
                    backref=db.backref('group', lazy='dynamic'),
                    lazy='dynamic')
    news = db.relationship('News', backref='house', lazy='dynamic')

    def __init__(self, name, description=''):
        self.name = name
        self.description = description

    def __repr__(self):
        return '<Group %r>' % (self.name)

    def to_json(self):  # json 출력 루틴
        json_group = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at,
            'create_user': self.author.username,
            'create_user_name': self.author.realname,
            'users': [ user.username for user in self.users ]
        }
        return json_group
    
    @staticmethod
    def from_json(json_group):  # json 입력 루틴
        name = json_group.get('name')
        if name is None or name == '':
            raise ValidationError('group does not have a name')
        description = json_group.get('description')
        group = Group(name, description)

        # Group users JSON 입력값 처리 
        if json_group.get('users') is not None and json_group.get('users') != []:
            user_names = json_group.get('users')
            user_list = list(user_names)
            if type(user_list) == list and user_list is not None and len(user_list) >= 1:  # users 값이 비어있지 않다면 
            # 실제로 존재하는 유저에 대하여만 그룹에 추가
               group.users = [ User.query.filter_by(username=user_name).first() for user_name in user_list\
                               if User.query.filter_by(username=user_name).count() != 0 ]
        return group


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
    filename = db.Column(db.Text())
    filelocate = db.Column(db.Text())
    notice = db.Column(db.Boolean)

    comments = db.relationship('Comment', backref='news', lazy='dynamic')
    group = db.Column(db.Integer, db.ForeignKey('groups.id'))

    def __init__(self, context, parsed_context, author=None, group=None, notice=False):
        self.context = context
        self.parsed_context = parsed_context
        self.group = group
        self.notice = notice
        if author is not None:
            self.author_name = author.realname
            self.author = author

    def __repr__(self):
        return '<News [%r](%r):%r>' % (self.created_at, self.author_name, self.context)

    def to_json(self):  # json 출력 루틴
        json_news = {
            'id': self.id,
            'author': self.author.username,
            'author_name': self.author_name,
            'context': self.context,
            'created_at': self.created_at,
            'modified_at': self.modified_at,
			'file' : self.filename,
			'notice' : self.notice,
			'group' : self.group,
        }
        return json_news

    @staticmethod
    def from_json(json_news):  # json 입력 루틴
        from api_1_0.search import removeEscapeChar
        context = json_news.get('context')
        if context is None or context == '':
            raise ValidationError('news does not have a context')
        parsed_context = removeEscapeChar(context).lower()

        group = None
        if json_news.get('group') is not None and json_news.get('group') != '':
            group = json_news.get('group')

        news = News(context=context, parsed_context=parsed_context, group=group)
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
    parsed_context = db.Column(db.Text)
    created_at = db.Column(db.DateTime, index=True, default=datetime.utcnow)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    author_name = db.Column(db.String(64))
    news_id = db.Column(db.Integer, db.ForeignKey('news.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'))
    comments = db.relationship('Comment', lazy='dynamic')

    filename = db.Column(db.Text)
    filelocate = db.Column(db.Text)

    def __init__(self, context, parsed_context, news_id=None):
        self.context = context
        self.parsed_context = parsed_context
        self.news_id = news_id

    def __repr__(self):
        return '<Comment #%r[%r]: %r>' % (self.news_id, self.author_name, self.context)

    @staticmethod
    def from_json(json_comment):  # json 입력 루틴
        from api_1_0.search import removeEscapeChar
        context = json_comment.get('context')
        if context is None or context == '':
            raise ValidationError('comment does not have a context')
        parsed_context = removeEscapeChar(context).lower()
    
        return Comment(context=context, parsed_context=parsed_context)
    
    def to_json(self):  # json 출력 루틴
        json_comment = {
            'id': self.id,
            'author': self.author.username,
            'author_name': self.author_name,
            'context': self.context,
            'created_at': self.created_at,
            'file' : self.filename,
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

