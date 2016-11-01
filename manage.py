#!/usr/bin/env python
import os
from app import create_app, db, socketio
from app.models import User, News, Comment
from flask.ext.script import Manager, Shell, Command
from flask.ext.migrate import Migrate, MigrateCommand

app = create_app('default')
manager = Manager(app)
migrate = Migrate(app, db)

host='54.1.1.94'
port=5001

def make_shell_context():
    return dict(app=app, db=db, User=User, News=News)

manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command("db", MigrateCommand)

@manager.command
def rs():
    socketio.run(app, host=host, port=port, debug=True)

#@manager.command
#def runserver():
#    app.run(host=host, port=port)
#    socketio.run(app, host=host, port=port)
#    app.run(host=host, port=port) & socketio.run(app, host=host, port=port)

if __name__ == '__main__':
    manager.run()
