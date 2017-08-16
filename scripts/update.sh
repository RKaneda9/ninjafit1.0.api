#!/bin/bash
LOC=https://github.com/RKaneda9/ninjafit1.0.git

echo "Retrieving ninjafit1.0 from ${LOC} into temp folder..."
git clone ${LOC} ./scripts/temp

echo "Moving built folders and files into public folder..."
cp -R -v ./scripts/temp/public/* ./public

echo "Removing temp folder..."
rm -rf ./scripts/temp

echo "Updating ninjafit1.0.api..."
git pull origin master

echo "Restarting application..."
command -v forever restart app.js || npm start
