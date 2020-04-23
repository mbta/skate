# Fail if any command fails
set -e

ELIXIR_VERSION=1.10.2
ERLANG_VERSION=22.3.2
NODEJS_VERSION=10.15

change-phantomjs-version 2.1.1
nvm use $NODEJS_VERSION

export ERL_HOME="${SEMAPHORE_CACHE_DIR}/.kerl/installs/${ERLANG_VERSION}"
if [ ! -d "${ERL_HOME}" ]; then
    mkdir -p "${ERL_HOME}"
    KERL_BUILD_BACKEND=git kerl build $ERLANG_VERSION $ERLANG_VERSION
    kerl install $ERLANG_VERSION $ERL_HOME
fi
. $ERL_HOME/activate

kiex use $ELIXIR_VERSION || kiex install $ELIXIR_VERSION && kiex use $ELIXIR_VERSION
mix local.hex --force
mix local.rebar --force
mix deps.get

pushd assets && npm ci && popd
