#!/bin/bash
# Get the download link for your latest APK build

echo "=========================================="
echo "Fetching Your APK Download Links"
echo "=========================================="
echo ""

npx eas build:list --platform android --limit 5

echo ""
echo "=========================================="
echo "Instructions:"
echo "=========================================="
echo ""
echo "1. Look for the build with status: FINISHED"
echo "2. Copy the download URL"
echo "3. Share this URL with testers"
echo ""
echo "Users can download and install the APK directly on their Android phones."
echo ""
