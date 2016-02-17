from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy

#app = Flask(__name__)
#db = SQLAlchemy(app)

'''
@app.before_request():
    if request.method == 'OPTIONS':
        resp = app.make_dafault_options_response()

        headers = None
        if 'ACCESS_CONTROL_REQUEST_HEADERS' in request_headers:
            headers = request.headers['ACCESS_CONTROL_REQUEST_HEADERS']

        h = resp.headers

        h['Access-Control-Allow_Origin'] = request.headers['Origin']
        h['Access-Control-Allow-Methods'] = request.headers['Access-Control-Allow-Method']
        h['Access-Control-Max-Age'] = "10"

        if headers is not None:
            h['Access-Control-Allow-Headers'] = headers

        return resp

@app.after_request(resp):
    h = resp.headers

    if request.method != 'OPTIONS' and 'Origin' in request.headers:
        h['Access-Control-Allow-Origin'] = request.headers['Origin']

    return resp
'''
