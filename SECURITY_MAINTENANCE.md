# Legacy AFOCCERT security maintenance notes (2026-10-25)

> This repository is a legacy Python 2.7 / Flask 0.10.1 / AngularJS application.
> These components are end-of-life. **Do not expose this app to the Internet
> or use it for real business data before a supported-stack migration and
> end-to-end security testing.** The hardening PR is not a production approval.

## What changed

- Removed committed application signing secret and MySQL credential from source.
  Production requires `AFOCCERT_SECRET_KEY` and `AFOCCERT_DATABASE_URL`.
- Default debug mode is off; set `AFOCCERT_DEBUG=1` only for isolated local dev.
- The configured deployment must explicitly select production configuration:
  `create_app('production')`. The legacy `default` is still local development.
- CORS is disabled unless `AFOCCERT_CORS_ORIGINS` specifies trusted, comma-separated
  origins (include scheme and port; no wildcard for an authenticated API).
- Corrected user-ownership checks and private group/comment/attachment reads.
- Reworked attachments to use random server-side basenames; invalid uploads
  return HTTP 400; replaced files are deleted only after saving a new file.
- Disabled automatic commits at request teardown; writes explicitly commit.
- Fixed visible defects in comment uploads, user pictures, search and groups.
- Added dependency-free regression tests and a syntax-check CI workflow.
- Fixed merge-conflict debris in `requirements.txt`, **without claiming that
  the obsolete dependencies are safe or installable on modern Python.**
- Sanitized rich-text HTML before passing it to Angular's compiler.

## Immediate manual actions (not automated by this PR)

1. **Rotate** the previously committed Flask secret and the database user's
   password in any environment where they have ever been used. Assume old
   sessions/tokens are compromised. Removing strings from HEAD does not
   remove them from the Git history.
2. Inventory server instances, DB backups and exposed interfaces; turn off
   old HTTP-only deployments. Use HTTPS and restrict administrative access.
3. Supply deployment secrets via a secret manager/environment, never in the
   repository or a browser-delivered JavaScript file.
4. Run application-level integration tests with a fresh copy of *synthetic*
   test data before any deployment; existing Python2 dependencies are EOL.
5. Plan a staged Python 3 + supported Flask/SQLAlchemy + modern frontend
   migration; this should be a separate, test-backed project.
6. Implement rate limiting, registration policy, audit logs, CSRF/XSS
   assessment, dependency scanning, and secure HTTP header policy.

## Example production environment (values intentionally omitted)

```sh
export AFOCCERT_SECRET_KEY='<set-in-secret-manager>'
export AFOCCERT_DATABASE_URL='<database-url-from-secret-manager>'
export AFOCCERT_CORS_ORIGINS='https://your-trusted-app.example'
```

The WSGI entry point now selects `production` by default. For production
it fails to start unless the required environment secrets have been supplied.
Set `AFOCCERT_CONFIG=development` only in an isolated local test environment.
Verify database migrations before attempting a production start.
Neither this PR nor the CI workflow changes the running server.

## Validation limits

CI only checks source syntax with Python 3 and runs dependency-free helper tests.
It does **not** run the Python 2 application or perform end-to-end tests.
Avoid interpreting a green CI as evidence that this legacy app is safe to run.
