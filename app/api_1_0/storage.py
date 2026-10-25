# -*- coding: utf-8 -*-
"""Path validation helpers without Flask dependencies."""
import os


def extension(filename):
    if not filename or '.' not in filename:
        return None
    return filename.rsplit('.', 1)[1].lower()


def safe_stored_path(folder, filename):
    if not filename or filename in ('.', '..'):
        return None
    if '/' in filename or '\\' in filename:
        return None
    if os.path.basename(filename) != filename:
        return None
    return os.path.join(folder, filename)
