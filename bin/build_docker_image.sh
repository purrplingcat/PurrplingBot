#!/bin/bash

echo "Docker image build tool"
echo "-----------------------"
echo

ARCH=$(uname -m)
VENDOR="purrplingcat"
PRODUCT="purrplingbot"
NODE_VERSION="8.5.0"
TAG=${1:-latest}

echo "Product: $PRODUCT"
echo "Vendor: $VENDOR"
echo "Node version: $NODE_VERSION"
echo "Image tag: $TAG"
echo

case $ARCH in
  "x86_64")
    BASE_IMAGE="node:$NODE_VERSION-alpine"
    OUTPUT_IMAGE="$VENDOR/$PRODUCT:$TAG"
    ;;
  "i686")
    BASE_IMAGE="node:$NODE_VERSION-alpine"
    OUTPUT_IMAGE="$VENDOR/$PRODUCT-$ARCH:$TAG"
    ;;
  "aarch64")
    ARCH="arm64"
    BASE_IMAGE="purrplingcat/node:$NODE_VERSION-alpine_arm64"
    OUTPUT_IMAGE="$VENDOR/$PRODUCT-$ARCH:$TAG"
    ;;
  *)
    echo "Invalid architecture: $ARCH - Can't build Docker image!"
    exit 2;
esac

echo -e "Target image \e[32m$OUTPUT_IMAGE\e[0m \nBase image \e[31m$BASE_IMAGE\e[0m \nArchitecture \e[33m$ARCH\e[0m"
echo

sleep 5
sed -e "s/FROM node:8.5.0-alpine/FROM $BASE_IMAGE/" Dockerfile > Dockerfile.$ARCH
docker build -t $OUTPUT_IMAGE ./Dockerfile.$ARCH

CODE=$?

echo
if [ $CODE -ne 0 ]; then
  echo -e "Build \e[31mFAILED!\e[0m Status code: $CODE"
  exit $CODE
else
  echo -e "Build \e[32mSUCCESS!\e[0m"
  exit 0
fi
