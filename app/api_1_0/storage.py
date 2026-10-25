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
    candidate = os.path.join(folder, filename)
    # Disallow an in-directory symlink targeting a file outside uploads.
    if os.path.realpath(os.path.dirname(candidate)) != os.path.realpath(folder):
        return None
    if os.path.islink(candidate):
        return None
    return candidate
