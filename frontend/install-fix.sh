#!/bin/bash

echo "Installing missing dependencies..."
echo ""

# Install babel-preset-expo explicitly
npm install --save-dev babel-preset-expo@~12.0.5

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Now run: npx expo start --clear"
