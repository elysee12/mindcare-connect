import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreatmentChangeDto } from './dto/create-treatment-change.dto';
import { UpdateTreatmentChangeDto } from './dto/update-treatment-change.dto';

@Injectable()
export class TreatmentChangeService {
  constructor(private prisma: PrismaService) {}

  async create(createTreatmentChangeDto: CreateTreatmentChangeDto) {
    const { patientId, ...payload } = createTreatmentChangeDto;
    return this.prisma.treatmentChange.create({
      data: {
        patient: { connect: { id: patientId } },
        ...payload,
      },
      include: { patient: true },
    });
  }

  async findAll(mhpId?: number, familyId?: number) {
    let where: any = {};
    
    if (mhpId !== undefined) {
      // Show treatment changes for MHP's registered patients only
      where = {
        patient: {
          registeredByMhpId: mhpId
        }
      };
    } else if (familyId !== undefined) {
      // Show treatment changes for Family's assigned patients only
      where = {
        patient: {
          assignedFamilyId: familyId
        }
      };
    }
    
    return this.prisma.treatmentChange.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: true }
    });
  }

  async findOne(id: number) {
    return this.prisma.treatmentChange.findUnique({ where: { id } });
  }

  async update(id: number, updateTreatmentChangeDto: UpdateTreatmentChangeDto) {
    return this.prisma.treatmentChange.update({ where: { id }, data: updateTreatmentChangeDto });
  }

  async remove(id: number) {
    return this.prisma.treatmentChange.delete({ where: { id } });
  }
}
