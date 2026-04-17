import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

  async create(createReminderDto: CreateReminderDto) {
    const { patientId, ...payload } = createReminderDto;
    return this.prisma.reminder.create({
      data: {
        patient: { connect: { id: patientId } },
        ...payload,
      },
      include: { patient: true },
    });
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
