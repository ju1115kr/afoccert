from flask import jsonify
from . import api
from ..exceptions import ValidationError


@api.errorhandler(400)
def bad_request(e):
    return jsonify({'description': str(e)}), 400


@api.errorhandler(401)
def unauthorized(e):
    return jsonify({'description': str(e)}), 401


@api.errorhandler(403)
def forbidden(e):
    return jsonify({'desctiption': str(e)}), 403


@api.errorhandler(404)
def not_found(e):
    return jsonify({'description': str(e)}), 404


@api.errorhandler(ValidationError)
def validation_error(e):
    return bad_request(e.args[0])
