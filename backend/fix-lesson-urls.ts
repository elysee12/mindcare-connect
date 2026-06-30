**
 * Script to fix lesson file URLs
 * 
 * This script updates all lesson fileUrl fields to use the correct production backend URL.
 * Run this after uploading lessons to ensure file URLs are accessible.
 * 
 * Usage: npx ts-node fix-lesson-urls.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const OLD_URLS = [
  'http://10.170.130.24:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.',  // Match any 192.168.x.x
  'http://10.',       // Match any 10.x.x.x
  'https://mindcare-connect.onrender.com',  // In case someone deployed to Render
];

// Get the NEW_URL from environment variable
const NEW_URL = process.env.BACKEND_URL || 'http://10.8.34.27:3000';

async function fixLessonUrls() {
  console.log('🔧 Fixing lesson file URLs...');
  console.log(`📍 Target URL: ${NEW_URL}\n`);

  try {
    // Get all lessons with file URLs
    const lessons = await prisma.lesson.findMany({
      where: {
        fileUrl: {
          not: null,
        },
      },
    });

    console.log(`Found ${lessons.length} lessons with files\n`);

    let updatedCount = 0;

    for (const lesson of lessons) {
      if (!lesson.fileUrl) continue;

      let needsUpdate = false;
      let newFileUrl = lesson.fileUrl;

      // Check if URL contains any of the old URLs
      for (const oldUrl of OLD_URLS) {
        if (lesson.fileUrl.includes(oldUrl)) {
          // Extract the filename from the old URL
          const filenamePart = lesson.fileUrl.split('/uploads/')[1];
          if (filenamePart) {
            newFileUrl = `${NEW_URL}/uploads/${filenamePart}`;
            needsUpdate = true;
            break;
          }
        }
      }

      if (needsUpdate) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { fileUrl: newFileUrl },
        });

        console.log(`✅ Updated lesson #${lesson.id}: "${lesson.title}"`);
        console.log(`   Old: ${lesson.fileUrl}`);
        console.log(`   New: ${newFileUrl}\n`);
        updatedCount++;
      }
    }

    if (updatedCount === 0) {
      console.log('✨ No lessons needed URL updates. All file URLs are correct!\n');
    } else {
      console.log(`\n✅ Successfully updated ${updatedCount} lesson file URL(s)!\n`);
    }

    // Show summary of all lessons
    console.log('📋 Current lesson file URLs:');
    console.log('─'.repeat(60));
    
    const allLessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        fileUrl: true,
        fileName: true,
      },
      orderBy: { id: 'asc' },
    });

    for (const lesson of allLessons) {
      console.log(`\n#${lesson.id}: ${lesson.title}`);
      console.log(`   File: ${lesson.fileName || 'No file'}`);
      console.log(`   URL:  ${lesson.fileUrl || 'No URL'}`);
    }
    console.log('\n' + '─'.repeat(60));

  } catch (error) {
    console.error('❌ Error fixing lesson URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixLessonUrls()
  .then(() => {
    console.log('\n✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
