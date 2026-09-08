#!/usr/bin/env bash
# exit on error
set -o errexit

npm ci
npm run build

pipenv install --deploy --ignore-pipfile

python -m pipenv run upgrade
