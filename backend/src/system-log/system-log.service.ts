import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { UpdateSystemLogDto } from './dto/update-system-log.dto';

@Injectable()
export class SystemLogService {
  constructor(private prisma: PrismaService) {}

  async create(createSystemLogDto: CreateSystemLogDto) {
    return this.prisma.systemLog.create({ data: createSystemLogDto });
  }

  async findAll() {
    return this.prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  async findOne(id: number) {
    return this.prisma.systemLog.findUnique({ where: { id } });
  }

  async update(id: number, updateSystemLogDto: UpdateSystemLogDto) {
    return this.prisma.systemLog.update({ where: { id }, data: updateSystemLogDto });
  }

  async remove(id: number) {
    return this.prisma.systemLog.delete({ where: { id } });
  }

  async clearAll() {
    return this.prisma.systemLog.deleteMany({});
  }
}
