# Fail if any command fails
set -e

ELIXIR_VERSION=1.8.1
ERLANG_VERSION=21
NODEJS_VERSION=10.15

change-phantomjs-version 2.1.1
nvm use $NODEJS_VERSION

. /home/runner/.kerl/installs/$ERLANG_VERSION/activate
kiex use $ELIXIR_VERSION || kiex install $ELIXIR_VERSION && kiex use $ELIXIR_VERSION
mix local.hex --force
mix local.rebar --force
mix deps.get

pushd assets && npm ci && popd
