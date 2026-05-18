import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto) {
    const data = { ...createPatientDto };

    if (!data.assignedChwId) {
      delete data.assignedChwId;
    }
    if (!data.assignedFamilyId) {
      delete data.assignedFamilyId;
    }
    if (!data.registeredByMhpId) {
      delete data.registeredByMhpId;
    }

    const patient = await this.prisma.patient.create({ data });

    // Create system log for registration
    await this.prisma.systemLog.create({
      data: {
        event: `Patient ${patient.fullName} (ID: ${patient.id}) registered`,
        userId: patient.registeredByMhpId,
      },
    });

    // Create notifications for assigned CHW and Family Member
    if (patient.assignedChwId) {
      await this.prisma.notification.create({
        data: {
          type: 'ASSIGNMENT',
          title: 'New Patient Assigned',
          message: `Patient ${patient.fullName} has been assigned to you.`,
          userId: patient.assignedChwId,
        },
      });

      await this.prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} assigned to CHW (ID: ${patient.assignedChwId})`,
          userId: patient.registeredByMhpId,
        },
      });
    }

    if (patient.assignedFamilyId) {
      await this.prisma.notification.create({
        data: {
          type: 'ASSIGNMENT',
          title: 'Patient Assigned',
          message: `Patient ${patient.fullName} has been assigned to you.`,
          userId: patient.assignedFamilyId,
        },
      });

      await this.prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} assigned to Family Member (ID: ${patient.assignedFamilyId})`,
          userId: patient.registeredByMhpId,
        },
      });
    }

    return patient;
  }

  async findAll(search?: string, role?: string, mhpId?: string, assignedChwId?: string, assignedFamilyId?: string, tracked?: boolean) {
    const searchCondition = search
      ? {
          OR: [
            { fullName: { contains: search } },
            { diagnosis: { contains: search } },
            { status: { contains: search } },
            { riskLevel: { contains: search } },
          ],
        }
      : undefined;

    const conditions: any[] = [];
    if (searchCondition) conditions.push(searchCondition);
    
    // Filtering by specific IDs should be primary
    if (assignedChwId) {
      conditions.push({ assignedChwId: +assignedChwId });
    } else if (assignedFamilyId) {
      conditions.push({ assignedFamilyId: +assignedFamilyId });
    } else if (mhpId) {
      conditions.push({ registeredByMhpId: +mhpId });
    } else if (role) {
      // General role-based filtering if no specific ID is provided
      const upperRole = role.toUpperCase();
      if (upperRole === 'CHW') {
        conditions.push({ assignedChwId: { not: null } });
      } else if (upperRole === 'MHP') {
        conditions.push({ registeredByMhpId: { not: null } });
      } else if (upperRole === 'FAMILY') {
        conditions.push({ assignedFamilyId: { not: null } });
      }
    }

    if (tracked !== undefined) {
      conditions.push({ tracked });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    return this.prisma.patient.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: { assignedFamily: true, registeredByMhp: true, assignedChw: true },
    });
  }

  async findTracked() {
    return this.prisma.patient.findMany({
      where: { tracked: true },
      orderBy: { fullName: 'asc' },
      include: { registeredByMhp: true, assignedFamily: true, assignedChw: true },
    });
  }

  async trackPatient(id: number) {
    const patient = await this.prisma.patient.update({
      where: { id },
      data: { 
        tracked: true,
        foundByUserId: null,
        locationFound: null,
        foundDetails: null,
      },
    });

    // Create notification for family member when patient is tracked
    if (patient.assignedFamilyId) {
      await this.prisma.notification.create({
        data: {
          type: 'TRACKING',
          title: 'Patient Being Tracked',
          message: `Patient ${patient.fullName} is now being tracked.`,
          userId: patient.assignedFamilyId,
        },
      });
    }

    await this.prisma.systemLog.create({
      data: {
        event: `Patient ${patient.fullName} (ID: ${id}) tracking started`,
      },
    });

    return patient;
  }

  async markAsFound(id: number, finderId: number, location: string, details?: string) {
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        tracked: false,
        foundByUserId: finderId,
        locationFound: location,
        foundDetails: details,
      },
      include: {
        foundByUser: true,
        registeredByMhp: true,
      },
    });

    // Notify the assigned CHW instead of the MHP
    if (patient.assignedChwId) {
      await this.prisma.notification.create({
        data: {
          type: 'PATIENT_FOUND',
          title: 'Missing Patient Found',
          message: `${patient.fullName} has been located at ${location} by ${patient.foundByUser?.fullName}.`,
          userId: patient.assignedChwId,
          // Store extra metadata as JSON in the database if the schema supports it, 
          // or we can just fetch the patient data when viewing the notification.
        },
      });
    }

    return patient;
  }

  async findOne(id: number) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        assignedChw: true,
        assignedFamily: true,
        followups: true,
        reminders: true,
        treatmentChanges: true,
      },
    });
  }

  async update(id: number, updatePatientDto: UpdatePatientDto) {
    const currentPatient = await this.prisma.patient.findUnique({
      where: { id },
    });

    const data = { ...updatePatientDto };

    if (!data.assignedChwId) {
      delete data.assignedChwId;
    }
    if (!data.assignedFamilyId) {
      delete data.assignedFamilyId;
    }
    if (!data.registeredByMhpId) {
      delete data.registeredByMhpId;
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data,
    });

    // Create system log for update
    await this.prisma.systemLog.create({
      data: {
        event: `Patient ${patient.fullName} (ID: ${id}) updated`,
        userId: patient.registeredByMhpId,
      },
    });

    // Notify new CHW if assignment changed
    if (data.assignedChwId && data.assignedChwId !== currentPatient.assignedChwId) {
      await this.prisma.notification.create({
        data: {
          type: 'ASSIGNMENT',
          title: 'New Patient Assigned',
          message: `Patient ${patient.fullName} has been assigned to you.`,
          userId: patient.assignedChwId,
        },
      });

      await this.prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} reassigned to CHW (ID: ${patient.assignedChwId})`,
          userId: patient.registeredByMhpId,
        },
      });
    }

    // Notify new Family Member if assignment changed
    if (data.assignedFamilyId && data.assignedFamilyId !== currentPatient.assignedFamilyId) {
      await this.prisma.notification.create({
        data: {
          type: 'ASSIGNMENT',
          title: 'Patient Assigned',
          message: `Patient ${patient.fullName} has been assigned to you.`,
          userId: patient.assignedFamilyId,
        },
      });

      await this.prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} reassigned to Family Member (ID: ${patient.assignedFamilyId})`,
          userId: patient.registeredByMhpId,
        },
      });
    }

    return patient;
  }

  async remove(id: number) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    
    if (patient) {
      await this.prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} (ID: ${id}) deleted`,
          userId: patient.registeredByMhpId,
        },
      });
    }

    return this.prisma.patient.delete({ where: { id } });
  }
}
