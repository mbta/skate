#!/bin/bash
set -e -x
APP=skate
BUILD_TAG=$APP:_build
BUILD_ARTIFACT=$APP-build.zip

docker build --build-arg SENTRY_ORG --build-arg SENTRY_PROJECT --build-arg SENTRY_AUTH_TOKEN --pull -t $BUILD_TAG .
CONTAINER=$(docker run -d ${BUILD_TAG} sleep 2000)

docker cp $CONTAINER:/root/_build/prod/rel/$APP/. rel/

docker kill $CONTAINER
docker rm $CONTAINER

test -f $BUILD_ARTIFACT && rm $BUILD_ARTIFACT
cd rel
zip -r ../$BUILD_ARTIFACT Dockerfile bin erts* lib releases .ebextensions
rm -r erts* lib releases bin
cd ..
