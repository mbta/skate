#!/bin/bash
set -e -x

VERSION=$(grep -o 'version: .*"' mix.exs  | grep -E -o '([0-9]+\.)+[0-9]+')
APP=skate
CACHE_CONTROL="public,max-age=31536000"
S3_DIR=s3://mbta-dotcom/$APP
BUILD_TAG=${1}
TEMP_DIR=$(mktemp -d)
STATIC_DIR=$TEMP_DIR/priv/static

pushd "$TEMP_DIR" > /dev/null
sh -c "docker run --rm ${BUILD_TAG} tar -c /home/skate/priv/static" | tar -x --strip-components 2
popd> /dev/null

# sync the digested files with a cache control header
aws s3 sync "${STATIC_DIR}/css" "${S3_DIR}/css" --size-only --exclude "*" --include "*-*" --cache-control=$CACHE_CONTROL
aws s3 sync "${STATIC_DIR}/images" "${S3_DIR}/images" --size-only --exclude "*" --include "*-*" --cache-control=$CACHE_CONTROL
aws s3 sync "${STATIC_DIR}/js" "${S3_DIR}/js" --size-only --exclude "*" --include "*-*" --cache-control=$CACHE_CONTROL
aws s3 sync $STATIC_DIR $S3_DIR --size-only --exclude "*" --include "*-*" --cache-control=$CACHE_CONTROL

# font content-types need to be specified manually
aws s3 sync "$STATIC_DIR/fonts" "$S3_DIR/fonts" --size-only --exclude "*" --include "*.woff" --cache-control=$CACHE_CONTROL --content-type "font/woff"
aws s3 sync "$STATIC_DIR/fonts" "$S3_DIR/fonts" --size-only --exclude "*" --include "*.woff2" --cache-control=$CACHE_CONTROL --content-type "font/woff2"

# sync everything else normally
aws s3 sync $STATIC_DIR $S3_DIR --size-only

# upload source maps to Sentry
npx @sentry/cli@2.20.0 sourcemaps inject "$STATIC_DIR/js"
npx @sentry/cli@2.20.0 sourcemaps upload "$STATIC_DIR/js"
