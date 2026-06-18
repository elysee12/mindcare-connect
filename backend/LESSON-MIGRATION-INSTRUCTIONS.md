# Lesson Module Migration Instructions

## What Was Added

A comprehensive Content/Lessons Management system has been added to MindCare Connect.

### Features:
1. **Admin Dashboard**: Create, edit, delete, and manage educational lessons
2. **File Upload Support**: Attach PDFs, documents, images, or videos to lessons  
3. **Categorization**: Organize lessons by category (Mental Health Basics, Patient Care, etc.)
4. **User Access**: All users (MHP, CHW, FAMILY, ADMIN) can view and access lessons
5. **Search & Filter**: Search by title/description and filter by category
6. **Document Viewer**: Open attached documents directly from the app
7. **Notifications**: Users are notified when new lessons are published
8. **System Logs**: All lesson operations are logged for auditing

---

## Step 1: Run Database Migration

### Option A: Using Prisma Migrate (Recommended)

```bash
cd /d/project/mindcare-connect/backend

# Generate and apply migration
npx prisma migrate dev --name add_lesson_model

# This will:
# 1. Create the Lesson table in your database
# 2. Add the relation to User table
# 3. Update Prisma Client
```

### Option B: Using Prisma DB Push (Faster for Development)

```bash
cd /d/project/mindcare-connect/backend

# Push schema changes directly to database
npx prisma db push

# Regenerate Prisma Client
npx prisma generate
```

---

## Step 2: Restart Backend Server

```bash
cd /d/project/mindcare-connect/backend
npm run start
```

The backend will now include the `/api/lessons` endpoints.

---

## Step 3: Test the API Endpoints

### Available Endpoints:

1. **GET /api/lessons** - Get all published lessons
   - Query params: `?search=term&category=Mental%20Health%20Basics`

2. **GET /api/lessons/:id** - Get a specific lesson

3. **POST /api/lessons** - Create a new lesson (Admin only)
   ```json
   {
     "title": "Understanding Depression",
     "description": "Learn about depression symptoms and treatment",
     "category": "Mental Health Basics",
     "fileUrl": "https://example.com/file.pdf",
     "fileName": "depression-guide.pdf",
     "fileType": "application/pdf",
     "fileSize": 1024000,
     "isPublished": true
   }
   ```

4. **PATCH /api/lessons/:id** - Update a lesson

5. **DELETE /api/lessons/:id** - Delete a lesson

6. **GET /api/lessons/categories** - Get all unique categories

---

## Step 4: Access from Frontend

### Admin Users:
Navigate to: **Admin Dashboard > Features > Lesson Management**

Or access directly via:
- List: `/(admin)/features/lesson-management`
- Add New: `/(admin)/features/add-lesson`
- Edit: `/(admin)/features/edit-lesson?id={lessonId}`

### All Users (MHP, CHW, FAMILY, ADMIN):
Navigate to: **Shared Features > Training Content**

Or access directly via:
- View Lessons: `/(shared)/lessons`

---

## Database Schema

### Lesson Model

```prisma
model Lesson {
  id          Int      @id @default(autoincrement())
  title       String
  description String   @db.Text
  fileUrl     String?
  fileName    String?
  fileType    String?
  fileSize    Int?
  category    String?
  isPublished Boolean  @default(true)
  createdBy   Int?
  creator     User?    @relation(fields: [createdBy], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Features Overview

### For Administrators:

1. **Create Lessons**
   - Add title and description
   - Choose optional category
   - Upload optional document (PDF, Word, PowerPoint, images, videos)
   - Auto-publish to all users

2. **Manage Lessons**
   - View all published lessons in a card-based layout
   - Edit any lesson (title, description, category, document)
   - Delete lessons with confirmation
   - Preview attached documents

3. **System Integration**
   - Automatic notifications sent to all users when new lesson is published
   - System logs track all create/update/delete operations
   - File uploads integrated with existing upload module

### For End Users (All Roles):

1. **Browse Lessons**
   - View all published training content
   - Search by title or description
   - Filter by category
   - See lesson metadata (creator, date, file info)

2. **Access Content**
   - Open attached documents directly in browser
   - View file type, name, and size
   - No login required after initial authentication

---

## File Upload Details

- **Supported Types**: PDF, Word, PowerPoint, Images, Videos
- **Max Size**: 50MB per file
- **Storage**: Files stored in `backend/uploads/` directory
- **Access**: Files served via `/uploads/{filename}` endpoint
- **Security**: JWT authentication required for upload

---

## Troubleshooting

### Migration Fails

If you get an error about existing tables:

```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or force push
npx prisma db push --force-reset
```

### Backend Doesn't Start

1. Check if Prisma Client is generated:
   ```bash
   npx prisma generate
   ```

2. Verify database connection in `.env`:
   ```
   DATABASE_URL="mysql://root:@localhost:3306/mindcare-connect"
   ```

### Frontend Errors

1. Clear cache and restart:
   ```bash
   cd /d/project/mindcare-connect/frontend
   npx expo start --clear
   ```

2. Check API connection in `app.json`:
   ```json
   "extra": {
     "BACKEND_URL": "https://mindcare-connect.onrender.com"
   }
   ```

---

## Next Steps

1. Run the migration (Step 1 above)
2. Restart backend server
3. Test lesson creation in Admin dashboard
4. Verify users can view lessons
5. Build new APK with updated features

---

**Everything is ready to go! Just run the migration and restart the backend.** 🚀
