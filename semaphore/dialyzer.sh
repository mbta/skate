set -e

export MIX_ENV=dev
mix compile --force
find $SEMAPHORE_CACHE_DIR -name "dialyxir_*_deps-$MIX_ENV.plt*" | xargs -I{} cp '{}' _build/$MIX_ENV
export ERL_CRASH_DUMP=/dev/null
mix dialyzer --plt
cp _build/$MIX_ENV/*_deps-$MIX_ENV.plt* $SEMAPHORE_CACHE_DIR
mix dialyzer --halt-exit-status
