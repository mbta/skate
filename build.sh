#!/bin/bash
set -e -x
PREFIX=_build/prod/
APP=skate
BUILD_TAG=$APP:_build
VERSION=$(grep -o 'version: .*"' mix.exs | grep -E -o '([0-9]+\.)+[0-9]+')
BUILD_ARTIFACT=$APP-build.zip

docker build --pull -t $BUILD_TAG .
CONTAINER=$(docker run -d ${BUILD_TAG} sleep 2000)

rm -rf rel/$APP rel/$APP.tar.gz
docker cp $CONTAINER:/root/${PREFIX}rel/$APP/releases/$VERSION/$APP.tar.gz rel/$APP.tar.gz

docker kill $CONTAINER
docker rm $CONTAINER
tar -zxf rel/$APP.tar.gz -C rel/
rm rel/$APP.tar.gz

test -f $BUILD_ARTIFACT && rm $BUILD_ARTIFACT
cd rel
zip -r ../$BUILD_ARTIFACT Dockerfile bin erts* lib releases .ebextensions
rm -r erts* lib releases bin
cd ..
