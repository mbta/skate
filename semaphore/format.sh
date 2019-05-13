set -e

mix format --check-formatted
pushd assets && npm run check && popd
