#!/bin/sh

projectDir=$(pwd)
pluginDirs=$(find plugins -maxdepth 2 -name package.json | sed "s/package.json//")

echo "Found plugin dirs: $pluginDirs"

for pluginDir in $pluginDirs; do
  cd $pluginDir
  echo "Installing NPM dependencies for: $pluginDir"
  npm install
  #mv -f node_modules/* $projectDir/node_modules
done

echo "OK"
