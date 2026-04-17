import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';

@Injectable()
export class FollowupService {
  constructor(private prisma: PrismaService) {}

  async create(createFollowupDto: CreateFollowupDto) {
    const { patientId, ...payload } = createFollowupDto;
    return this.prisma.followup.create({
      data: {
        patient: { connect: { id: patientId } },
        ...payload,
      },
      include: { patient: true },
    });
  }

  async findByPatient(patientId: number) {
    return this.prisma.followup.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
  }

  async findAllGlobal(mhpId?: number, search?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (mhpId) {
      where.patient = {
        registeredByMhpId: mhpId,
      };
    }

    if (search) {
      where.OR = [
        { patient: { fullName: { contains: search } } },
        { patient: { id: !isNaN(Number(search)) ? Number(search) : undefined } },
      ].filter(cond => cond.patient.id !== undefined || cond.patient.fullName !== undefined);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return this.prisma.followup.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.followup.findUnique({ where: { id } });
  }

  async update(id: number, updateFollowupDto: UpdateFollowupDto) {
    return this.prisma.followup.update({ where: { id }, data: updateFollowupDto });
  }

  async remove(id: number) {
    return this.prisma.followup.delete({ where: { id } });
  }
}
