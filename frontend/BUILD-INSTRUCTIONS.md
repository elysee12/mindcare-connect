# MindCare Connect - APK Build Instructions

## ✅ What's Already Done

1. **Backend URL Updated**: App now points to `https://mindcare-connect.onrender.com`
2. **New App Icon Configured**: Professional icon from IconKitchen with proper adaptive icon support
3. **All Changes Committed**: Code is pushed to GitHub
4. **EAS Build Configured**: Ready to build APK

---

## 🚀 Build Your APK (Choose One Method)

### Method 1: Using the Build Script (Easiest)

Open **Git Bash** and run:

```bash
cd /d/project/mindcare-connect/frontend
bash build-apk.sh
```

This script will:
- Check if you're logged into EAS (and log you in if needed)
- Start the APK build process
- Show you the progress

### Method 2: Manual Commands

Open **Git Bash** and run these commands:

```bash
cd /d/project/mindcare-connect/frontend

# 1. Login to EAS (if not already logged in)
npx eas login

# 2. Build the APK
npx eas build --platform android --profile preview
```

---

## 📱 Get Your APK Download Link

After the build completes (10-15 minutes), get your download link:

### Option A: Using the Script

```bash
cd /d/project/mindcare-connect/frontend
bash get-apk-link.sh
```

### Option B: Manual Command

```bash
npx eas build:list --platform android
```

This will show you all your builds with download URLs.

---

## 📤 Share Your APK

Once you have the download link:

1. **Copy the URL** from the build list
2. **Share it** with your testers via:
   - Email
   - WhatsApp
   - Telegram
   - Any messaging platform

3. **Users can install** by:
   - Opening the link on their Android phone
   - Downloading the APK
   - Installing it (they may need to enable "Install from Unknown Sources")

---

## 🔍 Check Build Status Anytime

```bash
npx eas build:list
```

Build statuses:
- `IN_QUEUE` - Waiting to start
- `IN_PROGRESS` - Currently building
- `FINISHED` - ✅ Ready to download!
- `ERRORED` - ❌ Build failed (check logs)

---

## 📧 Email Notifications

You'll receive an email at your Expo account email when:
- Build starts
- Build completes
- Build fails

The email will include the download link!

---

## 🆘 Troubleshooting

### "Not logged in to EAS"
```bash
npx eas login
```
Enter your Expo credentials.

### "Project not configured"
Already configured! Your project ID: `a523e007-93d9-40cf-81e2-4a7379924cd2`

### "Build failed"
```bash
npx eas build:view [BUILD_ID]
```
Replace `[BUILD_ID]` with the ID from the build list.

### Need to rebuild?
```bash
npx eas build --platform android --profile preview
```
You can build as many times as you need!

---

## 📊 Build Profiles

Your app has two build profiles configured:

### Preview Profile (Recommended for Testing)
```bash
npx eas build --platform android --profile preview
```
- Builds APK file
- Internal distribution
- Perfect for testing

### Production Profile (For Play Store)
```bash
npx eas build --platform android --profile production
```
- Builds APK or AAB
- Ready for Google Play Store
- Auto-increments version number

---

## ✨ What's Included in This Build

- ✅ Production backend: `https://mindcare-connect.onrender.com`
- ✅ New professional app icon (no white circle!)
- ✅ All latest features and bug fixes
- ✅ Proper adaptive icon for all Android devices
- ✅ Optimized for distribution

---

## 🎯 Next Steps

1. **Run the build script** or manual commands above
2. **Wait 10-15 minutes** for the build to complete
3. **Get the download link** using the get-apk-link script
4. **Share with testers** and collect feedback!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the build logs: `npx eas build:view [BUILD_ID]`
2. Verify your EAS account: `npx eas whoami`
3. Check build status: `npx eas build:list`

---

**Happy Building! 🚀**
