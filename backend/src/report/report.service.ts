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

  async findAll(mhpId?: number, search?: string, startDate?: Date, endDate?: Date, chwId?: number) {
    const conditions: any[] = [];
    const followupConditions: any[] = [];
    
    if (mhpId !== undefined) {
      const mhpFilter = {
        OR: [
          { patient: { registeredByMhpId: mhpId } },
          { mhpId }
        ]
      };
      conditions.push(mhpFilter);
      followupConditions.push({ patient: { registeredByMhpId: mhpId } });
    }

    if (chwId !== undefined) {
      conditions.push({ createdByChwId: chwId });
      followupConditions.push({ createdById: chwId });
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search } },
          { details: { contains: search } },
          { patient: { fullName: { contains: search } } },
          { patient: { id: !isNaN(Number(search)) ? Number(search) : undefined } },
        ].filter(cond => (cond as any).patient?.id !== undefined || (cond as any).patient?.fullName !== undefined || (cond as any).title !== undefined || (cond as any).details !== undefined)
      };
      conditions.push(searchFilter);
      followupConditions.push({
        OR: [
          { notes: { contains: search } },
          { patient: { fullName: { contains: search } } },
          { patient: { id: !isNaN(Number(search)) ? Number(search) : undefined } },
        ].filter(cond => (cond as any).patient?.id !== undefined || (cond as any).patient?.fullName !== undefined || (cond as any).notes !== undefined)
      });
    }

    if (startDate || endDate) {
      const dateCondition: any = {};
      if (startDate) dateCondition.gte = startDate;
      if (endDate) dateCondition.lte = endDate;
      conditions.push({ createdAt: dateCondition });
      followupConditions.push({ createdAt: dateCondition });
    }
    
    const where = conditions.length > 0 ? { AND: conditions } : {};
    const followupWhere = followupConditions.length > 0 ? { AND: followupConditions } : {};
    
    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        createdByChw: true,
        mhp: true,
      },
    });

    const followups = await this.prisma.followup.findMany({
      where: followupWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: true,
        createdBy: true,
      },
    });

    // Normalize and combine
    const normalizedReports = reports.map(r => ({
      ...r,
      type: 'regular',
    }));

    const normalizedFollowups = followups.map(f => ({
      id: `f-${f.id}`,
      patientId: f.patientId,
      patient: f.patient,
      createdByChwId: f.createdById,
      createdByChw: f.createdBy,
      title: 'Follow-up Report',
      details: `Status: ${f.mentalStatus}. Notes: ${f.notes}${f.relapseSigns ? ' (Relapse Signs Observed)' : ''}`,
      createdAt: f.createdAt,
      type: 'followup',
      mentalStatus: f.mentalStatus,
      relapseSigns: f.relapseSigns,
    }));

    return [...normalizedReports, ...normalizedFollowups].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async update(id: number, updateReportDto: Partial<CreateReportDto>) {
    return this.prisma.report.update({
      where: { id },
      data: updateReportDto,
      include: {
        patient: true,
        createdByChw: true,
        mhp: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.report.delete({
      where: { id },
    });
  }

  async getStats(mhpId?: number) {
    // Count both regular reports and follow-up reports for this MHP's patients
    const regularReportCount = await this.prisma.report.count({
      where: mhpId ? { 
        OR: [
          { patient: { registeredByMhpId: mhpId } },
          { mhpId: mhpId }
        ]
      } : undefined,
    });

    const followUpReportCount = await this.prisma.followup.count({
      where: mhpId ? { patient: { registeredByMhpId: mhpId } } : undefined,
    });

    const totalReports = regularReportCount + followUpReportCount;

    const totalAppointments = await this.prisma.reminder.count({
      where: {
        type: 'appointment',
        patient: mhpId ? { registeredByMhpId: mhpId } : undefined,
      },
    });

    // Relapses from both sources
    const followUpRelapses = await this.prisma.followup.count({
      where: {
        mentalStatus: 'Relapse',
        patient: mhpId ? { registeredByMhpId: mhpId } : undefined,
      },
    });
    
    // We could also search regular reports for "Relapse" in title/details if needed
    // but mentalStatus is the primary indicator now.

    const relapses = followUpRelapses;

    // Weekly success rate (last 7 days)
    const chartData: { day: string; value: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));

      const dayTotal = await this.prisma.reminder.count({
        where: {
          type: 'appointment',
          time: { gte: start.toISOString(), lte: end.toISOString() },
          patient: mhpId ? { registeredByMhpId: mhpId } : undefined,
        },
      });

      const dayAttended = await this.prisma.reminder.count({
        where: {
          type: 'appointment',
          status: 'ATTENDED',
          time: { gte: start.toISOString(), lte: end.toISOString() },
          patient: mhpId ? { registeredByMhpId: mhpId } : undefined,
        },
      });

      const successRate = dayTotal > 0 ? Math.round((dayAttended / dayTotal) * 100) : 0;
      chartData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        value: successRate,
      });
    }

    // Risk distribution - directly from Patient table status
    const patients = await this.prisma.patient.findMany({
      where: mhpId ? { registeredByMhpId: mhpId } : undefined,
      select: { status: true },
    });

    const stable = patients.filter(p => p.status === 'Stable').length;
    const atRisk = patients.filter(p => p.status === 'Risk' || p.status === 'At Risk').length;
    const relapsed = patients.filter(p => p.status === 'Relapse' || p.status === 'Relapsed').length;
    const totalPatients = patients.length;

    return {
      total: totalReports,
      appointments: totalAppointments,
      relapses,
      chartData,
      riskDistribution: {
        stable: totalPatients > 0 ? Math.round((stable / totalPatients) * 100) : 0,
        atRisk: totalPatients > 0 ? Math.round((atRisk / totalPatients) * 100) : 0,
        relapsed: totalPatients > 0 ? Math.round((relapsed / totalPatients) * 100) : 0,
        total: totalPatients,
      },
    };
  }
}
