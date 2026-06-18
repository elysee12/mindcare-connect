import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  async create(createLessonDto: CreateLessonDto) {
    const lesson = await this.prisma.lesson.create({
      data: createLessonDto,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create system log
    if (createLessonDto.createdBy) {
      await this.prisma.systemLog.create({
        data: {
          event: `New lesson "${lesson.title}" published (ID: ${lesson.id})`,
          userId: createLessonDto.createdBy,
        },
      });
    }

    // Create notification for all users about new lesson
    if (lesson.isPublished) {
      const users = await this.prisma.user.findMany({
        select: { id: true },
      });

      await this.prisma.notification.createMany({
        data: users.map((user) => ({
          type: 'LESSON',
          title: 'New Learning Material Available',
          message: `New lesson "${lesson.title}" has been published`,
          metadata: JSON.stringify({ 
            lessonId: lesson.id,
            lessonTitle: lesson.title 
          }),
          userId: user.id,
        })),
      });
    }

    return lesson;
  }

  async findAll(search?: string, category?: string) {
    const where: any = { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.lesson.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    return lesson;
  }

  async update(id: number, updateLessonDto: UpdateLessonDto) {
    const lesson = await this.findOne(id);

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create system log
    if (lesson.createdBy) {
      await this.prisma.systemLog.create({
        data: {
          event: `Lesson "${lesson.title}" updated (ID: ${lesson.id})`,
          userId: lesson.createdBy,
        },
      });
    }

    return updated;
  }

  async remove(id: number) {
    const lesson = await this.findOne(id);

    await this.prisma.lesson.delete({
      where: { id },
    });

    // Create system log
    if (lesson.createdBy) {
      await this.prisma.systemLog.create({
        data: {
          event: `Lesson "${lesson.title}" deleted (ID: ${lesson.id})`,
          userId: lesson.createdBy,
        },
      });
    }

    return { message: 'Lesson deleted successfully' };
  }

  async getCategories() {
    const lessons = await this.prisma.lesson.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    });

    return lessons
      .map((l) => l.category)
      .filter((c) => c !== null && c !== '')
      .sort();
  }
}
