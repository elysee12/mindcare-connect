#!/bin/bash
# MindCare Connect - APK Build Script
# This script will build your Android APK with EAS Build

echo "=========================================="
echo "MindCare Connect - APK Build"
echo "=========================================="
echo ""

# Check if logged into EAS
echo "Checking EAS login status..."
npx eas whoami

if [ $? -ne 0 ]; then
    echo ""
    echo "You need to login to EAS first."
    echo "Running: npx eas login"
    npx eas login
fi

echo ""
echo "=========================================="
echo "Starting APK Build (Preview Profile)"
echo "=========================================="
echo ""
echo "This will:"
echo "  ✓ Build an APK for Android"
echo "  ✓ Use production backend: https://mindcare-connect.onrender.com"
echo "  ✓ Include the new app icon"
echo "  ✓ Generate a download link for distribution"
echo ""
echo "Build will take approximately 10-15 minutes..."
echo ""

# Start the build
npx eas build --platform android --profile preview --non-interactive

echo ""
echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""
echo "To get your APK download link, run:"
echo "  npx eas build:list"
echo ""
echo "Or check your email for the build notification."
echo ""
