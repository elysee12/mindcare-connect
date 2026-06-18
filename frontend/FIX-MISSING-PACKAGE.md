# Fix Missing Package Error

## Error
```
Unable to resolve "expo-document-picker" from "app\(admin)\features\add-lesson.tsx"
```

## Solution

The `expo-document-picker` package is missing. Install it using Git Bash:

### Step 1: Open Git Bash

### Step 2: Install the Package

```bash
cd /d/project/mindcare-connect/frontend
npm install expo-document-picker
```

### Step 3: Restart Expo

```bash
npx expo start --clear
```

---

## That's it!

After installing the package, the lesson module will work perfectly.

The bundler will successfully compile and you can:
- Create lessons with document uploads
- Edit lessons
- View lessons with attached documents
