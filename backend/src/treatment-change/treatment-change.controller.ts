import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TreatmentChangeService } from './treatment-change.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTreatmentChangeDto } from './dto/create-treatment-change.dto';
import { UpdateTreatmentChangeDto } from './dto/update-treatment-change.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('treatment-changes')
export class TreatmentChangeController {
  constructor(
    private readonly treatmentChangeService: TreatmentChangeService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createTreatmentChangeDto: CreateTreatmentChangeDto, @Req() req) {
    const treatmentChange = await this.treatmentChangeService.create(createTreatmentChangeDto);
    const meta = JSON.stringify({ patientName: treatmentChange.patient.fullName });

    // Notify the creator (MHP)
    await this.notificationService.create({
      type: 'treatment_change_created',
      title: 'Treatment Change Recorded',
      message: `Treatment change for patient ${treatmentChange.patient.fullName} has been recorded.`,
      metadata: meta,
      userId: req.user.id,
    });

    // Notify assigned CHW
    if (treatmentChange.patient.assignedChwId) {
      await this.notificationService.create({
        type: 'treatment_change_created',
        title: 'Patient Treatment Updated',
        message: `Treatment for your patient ${treatmentChange.patient.fullName} has been updated.`,
        metadata: meta,
        userId: treatmentChange.patient.assignedChwId,
      });
    }

    // Notify assigned Family Member
    if (treatmentChange.patient.assignedFamilyId) {
      await this.notificationService.create({
        type: 'treatment_change_created',
        title: 'Treatment Update',
        message: `Clinical treatment for ${treatmentChange.patient.fullName} has been updated by MHP.`,
        metadata: meta,
        userId: treatmentChange.patient.assignedFamilyId,
      });
    }

    return treatmentChange;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req?: any) {
    const currentUserId = req?.user?.id;
    let effectiveMhpId: number | undefined = undefined;
    let effectiveFamilyId: number | undefined = undefined;

    if (currentUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser && currentUser.role === 'MHP') {
        effectiveMhpId = currentUserId;
      } else if (currentUser && currentUser.role === 'FAMILY') {
        effectiveFamilyId = currentUserId;
      }
    }

    return this.treatmentChangeService.findAll(effectiveMhpId, effectiveFamilyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.treatmentChangeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTreatmentChangeDto: UpdateTreatmentChangeDto) {
    return this.treatmentChangeService.update(+id, updateTreatmentChangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.treatmentChangeService.remove(+id);
  }
}
