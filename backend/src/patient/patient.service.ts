import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  private fixPhotoUrl(url: string | null): string | null {
    if (!url) return null;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    
    // If it's already an absolute URL but with potentially wrong host
    if (url.includes('/uploads/')) {
      const parts = url.split('/uploads/');
      const filename = parts[parts.length - 1];
      return `${backendUrl}/uploads/${filename}`;
    }
    
    return url;
  }

  async create(createPatientDto: CreatePatientDto) {
    console.log('=== Creating Patient ===');
    console.log('Input data:', createPatientDto);

    const data = { ...createPatientDto };

    if (!data.assignedChwId) {
      delete data.assignedChwId;
    }
    if (!data.registeredByMhpId) {
      delete data.registeredByMhpId;
    }

    // Use a transaction to ensure everything succeeds or fails together
    const result = await this.prisma.$transaction(async (prisma) => {
      let assignedFamilyId = data.assignedFamilyId;

      // Auto-create family member if no family ID is provided
      if (!assignedFamilyId) {
        console.log('Auto-creating family member');
        // Create a unique email for family member (using patient name + timestamp)
        const familyEmail = `${data.fullName.toLowerCase().replace(/\s+/g, '.')}.family.${Date.now()}@example.com`;
        
        const familyMember = await prisma.user.create({
          data: {
            fullName: `${data.fullName} (Family)`,
            email: familyEmail,
            password: 'Family@123', // Default password
            role: 'FAMILY',
            phone: data.contact,
            province: data.province,
            district: data.district,
            sector: data.sector,
            cell: data.cell,
            village: data.village,
          },
        });

        console.log('Family member created with ID:', familyMember.id);
        assignedFamilyId = familyMember.id;
      }

      console.log('Creating patient with data:', { ...data, assignedFamilyId });

      const patient = await prisma.patient.create({
        data: {
          ...data,
          assignedFamilyId,
        },
        include: { assignedFamily: true },
      });

      console.log('Patient created:', patient);

      // Create system log for registration
      await prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} (ID: ${patient.id}) registered`,
          userId: patient.registeredByMhpId,
        },
      });

      // Create notifications for assigned CHW and Family Member
      if (patient.assignedChwId) {
        await prisma.notification.create({
          data: {
            type: 'ASSIGNMENT',
            title: 'New Patient Assigned',
            message: `Patient ${patient.fullName} has been assigned to you.`,
            metadata: JSON.stringify({ patientName: patient.fullName }),
            userId: patient.assignedChwId,
          },
        });

        await prisma.systemLog.create({
          data: {
            event: `Patient ${patient.fullName} assigned to CHW (ID: ${patient.assignedChwId})`,
            userId: patient.registeredByMhpId,
          },
        });
      }

      if (patient.assignedFamilyId) {
        await prisma.notification.create({
          data: {
            type: 'ASSIGNMENT',
            title: 'Patient Assigned',
            message: `Patient ${patient.fullName} has been assigned to you.`,
            metadata: JSON.stringify({ patientName: patient.fullName }),
            userId: patient.assignedFamilyId,
          },
        });

        await prisma.systemLog.create({
          data: {
            event: `Patient ${patient.fullName} assigned to Family Member (ID: ${patient.assignedFamilyId})`,
            userId: patient.registeredByMhpId,
          },
        });
      }

      return patient;
    });

    console.log('=== Patient creation complete ===');
    return {
      ...result,
      photoUrl: this.fixPhotoUrl(result.photoUrl),
    };
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

    const patients = await this.prisma.patient.findMany({
      where,
      orderBy: { fullName: 'asc' },
      include: { assignedFamily: true, registeredByMhp: true, assignedChw: true },
    });

    return patients.map((p) => ({
      ...p,
      photoUrl: this.fixPhotoUrl(p.photoUrl),
    }));
  }

  async findTracked() {
    const patients = await this.prisma.patient.findMany({
      where: { tracked: true },
      orderBy: { fullName: 'asc' },
      include: { registeredByMhp: true, assignedFamily: true, assignedChw: true },
    });

    return patients.map((p) => ({
      ...p,
      photoUrl: this.fixPhotoUrl(p.photoUrl),
    }));
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
          metadata: JSON.stringify({ patientName: patient.fullName }),
          userId: patient.assignedFamilyId,
        },
      });
    }

    await this.prisma.systemLog.create({
      data: {
        event: `Patient ${patient.fullName} (ID: ${id}) tracking started`,
      },
    });

    return {
      ...patient,
      photoUrl: this.fixPhotoUrl(patient.photoUrl),
    };
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
          metadata: JSON.stringify({
            patientName: patient.fullName,
            location,
            finderName: patient.foundByUser?.fullName,
            patientId: patient.id,
            finderId: patient.foundByUser?.id,
          }),
          userId: patient.assignedChwId,
        },
      });
    }
    // Also notify the family member if assigned
    if (patient.assignedFamilyId) {
      await this.prisma.notification.create({
        data: {
          type: 'PATIENT_FOUND',
          title: 'Missing Patient Found',
          message: `${patient.fullName} has been located at ${location} by ${patient.foundByUser?.fullName}.`,
          metadata: JSON.stringify({
            patientName: patient.fullName,
            location,
            finderName: patient.foundByUser?.fullName,
            patientId: patient.id,
            finderId: patient.foundByUser?.id,
          }),
          userId: patient.assignedFamilyId,
        },
      });
    }

    return {
      ...patient,
      photoUrl: this.fixPhotoUrl(patient.photoUrl),
    };
  }

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        assignedChw: true,
        assignedFamily: true,
        followups: true,
        reminders: true,
        treatmentChanges: true,
      },
    });

    if (!patient) return null;

    return {
      ...patient,
      photoUrl: this.fixPhotoUrl(patient.photoUrl),
    };
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
          metadata: JSON.stringify({ patientName: patient.fullName }),
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
          metadata: JSON.stringify({ patientName: patient.fullName }),
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

    return {
      ...patient,
      photoUrl: this.fixPhotoUrl(patient.photoUrl),
    };
  }

  async remove(id: number) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    
    if (!patient) return null;

    // Use a transaction to delete all related records first (manual cascade)
    return this.prisma.$transaction(async (prisma) => {
      // 1. Delete all related records
      await prisma.followup.deleteMany({ where: { patientId: id } });
      await prisma.reminder.deleteMany({ where: { patientId: id } });
      await prisma.treatmentChange.deleteMany({ where: { patientId: id } });
      await prisma.report.deleteMany({ where: { patientId: id } });

      // 2. Log the event
      await prisma.systemLog.create({
        data: {
          event: `Patient ${patient.fullName} (ID: ${id}) deleted with all related history`,
          userId: patient.registeredByMhpId,
        },
      });

      // 3. Finally delete the patient
      return prisma.patient.delete({ where: { id } });
    });
  }
}
