set -e

mix coveralls.json
pushd assets && npm test && popd
bash <(curl -s https://codecov.io/bash)
