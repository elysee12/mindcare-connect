import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reminders')
export class ReminderController {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReminderDto: CreateReminderDto, @Req() req) {
    const reminder = await this.reminderService.create(createReminderDto);
    const meta = JSON.stringify({
      patientName: reminder.patient.fullName,
      reminderTitle: reminder.title,
      reminderTime: reminder.time,
    });

    // Notify creator
    await this.notificationService.create({
      type: 'reminder_created',
      title: 'Reminder Set',
      message: `Reminder for patient ${reminder.patient.fullName} has been set.`,
      metadata: meta,
      userId: req.user.id,
    });

    // Notify assigned CHW
    if (reminder.patient.assignedChwId) {
      await this.notificationService.create({
        type: 'reminder_created',
        title: 'New Patient Reminder',
        message: `A new reminder has been set for ${reminder.patient.fullName}.`,
        metadata: meta,
        userId: reminder.patient.assignedChwId,
      });
    }

    // Notify assigned Family Member
    if (reminder.patient.assignedFamilyId) {
      await this.notificationService.create({
        type: 'reminder_created',
        title: 'Appointment Scheduled',
        message: `A new appointment/reminder has been set for ${reminder.patient.fullName}.`,
        metadata: meta,
        userId: reminder.patient.assignedFamilyId,
      });
    }

    return reminder;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req?: any, @Query('patientId') patientId?: string) {
    const currentUserId = req?.user?.id;
    let effectiveMhpId: number | undefined = undefined;
    let effectiveChwId: number | undefined = undefined;
    let effectiveFamilyId: number | undefined = undefined;
    let pid = patientId ? +patientId : undefined;

    if (currentUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        if (currentUser.role === 'MHP') {
          effectiveMhpId = currentUserId;
        } else if (currentUser.role === 'CHW') {
          effectiveChwId = currentUserId;
        } else if (currentUser.role === 'FAMILY') {
          effectiveFamilyId = currentUserId;
        }
      }
    }

    return this.reminderService.findAll(effectiveMhpId, pid, effectiveChwId, effectiveFamilyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reminderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReminderDto: UpdateReminderDto) {
    return this.reminderService.update(+id, updateReminderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reminderService.remove(+id);
  }
}
