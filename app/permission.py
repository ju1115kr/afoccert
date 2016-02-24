# -*- coding: utf-8 -*-
from collections import namedtuple
from functools import partial

from flask import current_app, g
from flask.ext.principal import identity_loaded, Permission, RoleNeed, UserNeed

NewsNeed = namedtuple('news', ['method', 'value'])
ViewNewsNeed = partial(NewsNeed, 'view')


class ViewNewsPermission(Permission):
    def __init__(self, role_id):
        need = ViewNewsNeed(unicode(role_id))
        super(ViewNewsPermission, self).__init__(need)


@identity_loaded.connect_via(current_app)
def on_identity_loaded(sender, identity):
    # Set the identity user object
    identity.user = g.current_user

    # Add the UserNeed to the identity
    if hasattr(g.current_user, 'id'):
        identity.provides.add(UserNeed(g.current_user.id))

    # identity with the roles that the user provides
    if hasattr(g.current_user, 'roles'):
        for role in g.current_user.roles:
            identity.provides.add(RoleNeed(role.name))
