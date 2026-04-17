import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard')
  async getDashboard(@Query('role') role?: string, @Query('userId') userId?: string) {
    const roleQuery = role ? role.toUpperCase() : undefined;
    const uid = userId ? +userId : undefined;

    if (roleQuery === 'MHP') {
      if (!uid) {
        // If no userId provided, return empty stats
        return {
          totalPatients: 0,
          relapseRisk: 0,
          missedApps: 0,
        };
      }

      const totalPatients = await this.prisma.patient.count({
        where: { registeredByMhpId: uid },
      });

      const totalFollowups = await this.prisma.followup.count({
        where: {
          patient: {
            registeredByMhpId: uid,
          },
        },
      });

      const totalAppointments = await this.prisma.reminder.count({
        where: {
          patient: {
            registeredByMhpId: uid,
          },
        },
      });

      return {
        totalPatients,
        totalFollowups,
        totalAppointments,
      };
    }

    if (roleQuery === 'CHW') {
      if (!uid) {
        // If no userId provided, return empty stats
        return {
          totalPatients: 0,
          totalTrackedPatients: 0,
          totalAppointments: 0,
        };
      }

      const totalPatients = await this.prisma.patient.count({
        where: { assignedChwId: uid },
      });

      const totalTrackedPatients = await this.prisma.patient.count({
        where: {
          tracked: true,
        },
      });

      const totalAppointments = await this.prisma.reminder.count({
        where: {
          patient: {
            assignedChwId: uid,
          },
        },
      });

      return {
        totalPatients,
        totalTrackedPatients,
        totalAppointments,
      };
    }

    if (roleQuery === 'FAMILY') {
      if (!uid) {
        return {
          totalPatients: 0,
          totalAppointments: 0,
          totalTreatments: 0,
        };
      }

      const totalPatients = await this.prisma.patient.count({
        where: { assignedFamilyId: uid },
      });

      // Reminders (Appointments) for the patient assigned to this family member
      const totalAppointments = await this.prisma.reminder.count({
        where: {
          patient: {
            assignedFamilyId: uid,
          },
        },
      });

      // Total treatment changes for this family member's patient
      const totalTreatments = await this.prisma.treatmentChange.count({
        where: {
          patient: {
            assignedFamilyId: uid,
          },
        },
      });

      return {
        totalPatients,
        totalAppointments,
        totalTreatments,
      };
    }

    if (roleQuery === 'ADMIN') {
      const totalUsers = await this.prisma.user.count();
      const totalPatients = await this.prisma.patient.count();
      const activeCases = await this.prisma.patient.count({
        where: {
          status: { not: 'Stable' },
        },
      });

      // Additional admin stats
      const mhpCount = await this.prisma.user.count({
        where: { role: 'MHP' },
      });

      const chwCount = await this.prisma.user.count({
        where: { role: 'CHW' },
      });

      const totalFollowups = await this.prisma.followup.count();

      return {
        totalUsers,
        totalPatients,
        activeCases,
        mhpCount,
        chwCount,
        totalFollowups,
      };
    }

    // Default dashboard data (if no role specified)
    return {
      totalPatients: await this.prisma.patient.count(),
      totalUsers: await this.prisma.user.count(),
      totalFollowups: await this.prisma.followup.count(),
    };
  }

  @Get('system-logs')
  async getSystemLogs() {
    return [
      { id: 1, entry: 'User "Dr. John Professional" logged in', createdAt: new Date() },
      { id: 2, entry: 'New patient registered by CHW', createdAt: new Date() },
      { id: 3, entry: 'Treatment plan updated for Patient #102', createdAt: new Date() },
      { id: 4, entry: 'System backup completed successfully', createdAt: new Date() },
      { id: 5, entry: 'Role updated for user "Alice CHW"', createdAt: new Date() },
    ];
  }
}

