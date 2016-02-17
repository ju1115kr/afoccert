import sys
sys.path.insert(0, '/var/www/afoccert')

activate_this = '/var/www/afoccert/venv/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))

from app import create_app
application = create_app('default')
