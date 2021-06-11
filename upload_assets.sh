#!/bin/bash
set -e -x

VERSION=$(grep -o 'version: .*"' mix.exs  | grep -E -o '([0-9]+\.)+[0-9]+')
APP=skate
BUILD_ARTIFACT=$APP-build.zip
TEMP_DIR=tmp_unzip
CACHE_CONTROL="public,max-age=31536000"
STATIC_DIR=$TEMP_DIR/lib/$APP-$VERSION/priv/static
S3_DIR=s3://mbta-dotcom/$APP

unzip $BUILD_ARTIFACT "lib/$APP-$VERSION/priv/static/*" -d $TEMP_DIR

# sync the digested files with a cache control header
aws s3 sync $STATIC_DIR $S3_DIR --size-only --exclude "*" --include "*-*" --cache-control=$CACHE_CONTROL

# font content-types need to be specified manually
aws s3 sync $STATIC_DIR/fonts $S3_DIR/fonts --size-only --exclude "*" --include "*.woff" --cache-control=$CACHE_CONTROL --content-type "font/woff"
aws s3 sync $STATIC_DIR/fonts $S3_DIR/fonts --size-only --exclude "*" --include "*.woff2" --cache-control=$CACHE_CONTROL --content-type "font/woff2"

# sync everything else normally
aws s3 sync $STATIC_DIR $S3_DIR --size-only

rm -rf $TEMP_DIR
