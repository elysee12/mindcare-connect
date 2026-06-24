import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({ data: createNotificationDto });
  }

  async findAll(userId?: string) {
    const where = userId ? { userId: +userId } : {};
    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            workplace: true,
            province: true,
            district: true,
            sector: true,
            cell: true,
            village: true,
          }
        }
      }
    });

    // For PATIENT_FOUND notifications, fetch the finder user
    return Promise.all(
      notifications.map(async (notification) => {
        if (notification.type === 'PATIENT_FOUND' && notification.metadata) {
          try {
            const metadata = JSON.parse(notification.metadata);
            if (metadata.finderId) {
              const finder = await this.prisma.user.findUnique({
                where: { id: metadata.finderId },
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                  role: true,
                  workplace: true,
                  province: true,
                  district: true,
                  sector: true,
                  cell: true,
                  village: true,
                }
              });
              return { ...notification, finder };
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        return notification;
      })
    );
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            workplace: true,
            province: true,
            district: true,
            sector: true,
            cell: true,
            village: true,
          }
        }
      }
    });

    if (notification?.type === 'PATIENT_FOUND' && notification?.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata);
        if (metadata.finderId) {
          const finder = await this.prisma.user.findUnique({
            where: { id: metadata.finderId },
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              workplace: true,
              province: true,
              district: true,
              sector: true,
              cell: true,
              village: true,
            }
          });
          return { ...notification, finder };
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return notification;
  }

  async update(id: number, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notification.update({ where: { id }, data: updateNotificationDto });
  }

  async remove(id: number) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async clearAll(userId: number) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
