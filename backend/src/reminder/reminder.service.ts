import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private mailService: MailService,
  ) {}

  async create(createReminderDto: CreateReminderDto) {
    const { patientId, ...payload } = createReminderDto;
    const reminder = await this.prisma.reminder.create({
      data: {
        patient: { connect: { id: patientId } },
        ...payload,
      },
      include: {
        patient: {
          include: {
            assignedChw: true,
            assignedFamily: true,
          }
        }
      }
    });

    // Send immediate notification and email to CHW and Family
    const recipients = [
      reminder.patient.assignedChw,
      reminder.patient.assignedFamily,
    ].filter(Boolean);

    for (const recipient of recipients) {
      if (recipient) {
        // Notification
        await this.notificationService.create({
          type: 'APPOINTMENT_SCHEDULED',
          title: 'New Appointment Scheduled',
          message: `A new appointment "${reminder.title}" has been scheduled for ${reminder.patient.fullName} on ${reminder.time}.`,
          metadata: JSON.stringify({
            patientName: reminder.patient.fullName,
            appointmentTitle: reminder.title,
            appointmentTime: reminder.time,
          }),
          userId: recipient.id,
        });

        // Email
        if (recipient.email) {
          await this.mailService.sendAppointmentEmail(recipient.email, {
            patientName: reminder.patient.fullName,
            appointmentTitle: reminder.title,
            appointmentTime: reminder.time,
            type: 'creation',
          });
        }
      }
    }

    return reminder;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handle24HourReminders() {
    this.logger.log('Checking for appointments occurring in exactly 24 hours...');
    
    // Find reminders that are scheduled for approximately 24 hours from now
    // and haven't been notified yet. 
    // For simplicity in this demo, we'll check all uncompleted reminders.
    const now = new Date();
    const targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const upcomingReminders = await this.prisma.reminder.findMany({
      where: {
        completed: false,
        time: {
          contains: targetDateString,
        },
      },
      include: {
        patient: {
          include: {
            assignedChw: true,
            assignedFamily: true,
          }
        }
      }
    });

    for (const reminder of upcomingReminders) {
      const recipients = [
        reminder.patient.assignedChw,
        reminder.patient.assignedFamily,
      ].filter(Boolean);

      for (const recipient of recipients) {
        if (recipient) {
          // Notification
          await this.notificationService.create({
            type: 'APPOINTMENT_REMINDER',
            title: 'Appointment Reminder: 24h Remaining',
            message: `Reminder: The appointment "${reminder.title}" for ${reminder.patient.fullName} is tomorrow at ${reminder.time}.`,
            metadata: JSON.stringify({
              patientName: reminder.patient.fullName,
              appointmentTitle: reminder.title,
              appointmentTime: reminder.time,
            }),
            userId: recipient.id,
          });

          // Email
          if (recipient.email) {
            await this.mailService.sendAppointmentEmail(recipient.email, {
              patientName: reminder.patient.fullName,
              appointmentTitle: reminder.title,
              appointmentTime: reminder.time,
              type: 'reminder',
            });
          }
        }
      }
    }
  }

  async findAll(mhpId?: number, patientId?: number, chwId?: number, familyId?: number) {
    let where: any = {};
    
    if (patientId !== undefined) {
      where.patientId = patientId;
    }
    
    if (mhpId !== undefined) {
      // Show reminders for MHP's registered patients only
      where.patient = {
        registeredByMhpId: mhpId
      };
    } else if (chwId !== undefined) {
      // Show reminders for CHW's assigned patients only
      where.patient = {
        assignedChwId: chwId
      };
    } else if (familyId !== undefined) {
      // Show reminders for Family member's assigned patients only
      where.patient = {
        assignedFamilyId: familyId
      };
    }
    
    return this.prisma.reminder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: true }
    });
  }

  async findOne(id: number) {
    return this.prisma.reminder.findUnique({ where: { id } });
  }

  async update(id: number, updateReminderDto: UpdateReminderDto) {
    return this.prisma.reminder.update({ where: { id }, data: updateReminderDto });
  }

  async remove(id: number) {
    return this.prisma.reminder.delete({ where: { id } });
  }
}
