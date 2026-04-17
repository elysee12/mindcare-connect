import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async create(createReportDto: CreateReportDto) {
    const patient = await this.prisma.patient.findUnique({ where: { id: createReportDto.patientId } });
    const mhpId = patient?.registeredByMhpId ?? createReportDto.mhpId;

    return this.prisma.report.create({
      data: {
        ...createReportDto,
        mhpId,
      },
      include: {
        patient: true,
        createdByChw: true,
        mhp: true,
      },
    });
  }

  async findAll(mhpId?: number, search?: string, startDate?: Date, endDate?: Date) {
    const conditions: any[] = [];
    
    if (mhpId !== undefined) {
      conditions.push({
        OR: [
          { patient: { registeredByMhpId: mhpId } },
          { mhpId }
        ]
      });
    }

    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search } },
          { details: { contains: search } },
          { patient: { fullName: { contains: search } } },
          { patient: { id: !isNaN(Number(search)) ? Number(search) : undefined } },
        ].filter(cond => (cond as any).patient?.id !== undefined || (cond as any).patient?.fullName !== undefined || (cond as any).title !== undefined || (cond as any).details !== undefined)
      });
    }

    if (startDate || endDate) {
      const dateCondition: any = {};
      if (startDate) dateCondition.gte = startDate;
      if (endDate) dateCondition.lte = endDate;
      conditions.push({ createdAt: dateCondition });
    }
    
    const where = conditions.length > 0 ? { AND: conditions } : {};
    
    return this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        createdByChw: true,
        mhp: true,
      },
    });
  }

  async getStats(mhpId?: number) {
    const total = await this.prisma.report.count({
      where: mhpId ? { mhpId } : undefined,
    });
    // Mock stats for prototype - in a real app, we'd query followups, relapses, etc.
    return {
      total,
      missed: Math.floor(total * 0.15),
      relapses: Math.floor(total * 0.05),
    };
  }
}
