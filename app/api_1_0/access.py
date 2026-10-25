# -*- coding: utf-8 -*-
"""Shared access checks for private groups and their content."""


def can_read_group(group, user):
    return (group is not None and user is not None and
            (user.id == group.create_user or user in group.users))


def can_read_news(news, user):
    if news is None or user is None:
        return False
    if news.group is None:
        return True
    return can_read_group(news.house, user)


def can_read_comment(comment, user):
    return comment is not None and can_read_news(comment.news, user)
