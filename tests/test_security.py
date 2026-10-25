# -*- coding: utf-8 -*-
"""Dependency-free regression tests for the legacy security helpers."""
import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


def load_source(name, relpath):
    spec = importlib.util.spec_from_file_location(name, ROOT / relpath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


access = load_source('afoccert_access', 'app/api_1_0/access.py')
storage = load_source('afoccert_storage', 'app/api_1_0/storage.py')


class Actor(object):
    def __init__(self, identifier):
        self.id = identifier


class Group(object):
    def __init__(self, owner, users):
        self.create_user = owner
        self.users = users


class News(object):
    def __init__(self, group_id, group=None):
        self.group = group_id
        self.house = group


class Comment(object):
    def __init__(self, news):
        self.news = news


class AccessTests(unittest.TestCase):
    def setUp(self):
        self.owner = Actor(1)
        self.member = Actor(2)
        self.stranger = Actor(3)
        self.group = Group(self.owner.id, [self.member])
        self.private_news = News(42, self.group)

    def test_private_group_owner_and_member_only(self):
        self.assertTrue(access.can_read_group(self.group, self.owner))
        self.assertTrue(access.can_read_group(self.group, self.member))
        self.assertFalse(access.can_read_group(self.group, self.stranger))

    def test_private_news_and_its_comments_are_protected(self):
        self.assertTrue(access.can_read_news(self.private_news, self.owner))
        self.assertTrue(access.can_read_news(self.private_news, self.member))
        self.assertFalse(access.can_read_news(self.private_news, self.stranger))
        self.assertFalse(access.can_read_comment(Comment(self.private_news), self.stranger))

    def test_public_news_access_and_missing_parent_denied(self):
        self.assertTrue(access.can_read_news(News(None), self.stranger))
        self.assertFalse(access.can_read_news(None, self.member))
        self.assertFalse(access.can_read_news(News(42, None), self.member))


class StorageTests(unittest.TestCase):
    def test_rejects_parent_paths_and_windows_paths(self):
        for name in (None, '', '.', '..', '../secret.txt',
                     'subdir/secret.txt', '..\\secret.txt', 'C:\\secret.txt'):
            self.assertIsNone(storage.safe_stored_path('/tmp/uploads', name))

    def test_accepts_basename(self):
        self.assertEqual('/tmp/uploads/abcdef.pdf',
                         storage.safe_stored_path('/tmp/uploads', 'abcdef.pdf'))

    def test_extension_checks(self):
        self.assertEqual('jpg', storage.extension('photo.JPG'))
        self.assertIsNone(storage.extension('noextension'))
        self.assertIsNone(storage.extension(''))


class StaticSafetyTests(unittest.TestCase):
    def test_requirements_have_no_merge_markers(self):
        requirements = (ROOT / 'requirements.txt').read_text(encoding='utf-8')
        self.assertNotIn('>>>>>>>', requirements)
        self.assertNotIn('<<<<<<<', requirements)

    def test_database_and_flask_secrets_are_environmental(self):
        config = (ROOT / 'app/config.py').read_text(encoding='utf-8')
        self.assertIn("os.environ.get('AFOCCERT_SECRET_KEY')", config)
        self.assertIn("os.environ.get('AFOCCERT_DATABASE_URL')", config)
        self.assertIn('SQLALCHEMY_COMMIT_ON_TEARDOWN = False', config)


if __name__ == '__main__':
    unittest.main()
