#!/usr/bin/env bash
# exit on error
set -o errexit

npm ci
npm install
npm run build

python -m pip install pipenv
python -m pipenv install --deploy --ignore-pipfile

python -m pipenv run upgrade

if [[ -n "${ADMIN_USERNAME:-}" && -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
  python -m pipenv run flask --app src/app.py create-admin \
    --username "$ADMIN_USERNAME" \
    --email "$ADMIN_EMAIL" \
    --password "$ADMIN_PASSWORD" \
    --first-name "${ADMIN_FIRST_NAME:-}" \
    --last-name "${ADMIN_LAST_NAME:-}"
fi
