#!/usr/bin/env bash

set -e

export MIX_ENV=test

mix ecto.create &&
mix ecto.migrate &&
mix coveralls.json &&
pushd assets && npm test && popd
