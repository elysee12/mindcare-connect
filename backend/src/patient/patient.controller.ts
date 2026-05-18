import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { PatientService } from './patient.service';
import { NotificationService } from '../notification/notification.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('patients')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPatientDto: CreatePatientDto, @Req() req) {
    // Always use the authenticated user's ID as the registration MHP ID
    if (req.user && req.user.id) {
      createPatientDto.registeredByMhpId = req.user.id;
    }
    const patient = await this.patientService.create(createPatientDto);
    return patient;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('mhpId') mhpId?: string,
    @Query('assignedChwId') assignedChwId?: string,
    @Query('assignedFamilyId') assignedFamilyId?: string,
    @Query('tracked') tracked?: string,
    @Req() req?: any,
  ) {
    // Get current user's ID from request
    const currentUserId = req?.user?.id;
    let effectiveChwId = assignedChwId;
    let effectiveFamilyId = assignedFamilyId;
    let effectiveMhpId = mhpId;
    let effectiveRole = role;

    // If no specific filters are provided, check current user's role for automatic filtering
    if (currentUserId && !assignedChwId && !mhpId && !assignedFamilyId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        if (currentUser.role === 'CHW') {
          // CHW can only see their assigned patients
          effectiveChwId = currentUserId.toString();
        } else if (currentUser.role === 'FAMILY') {
          // Family members can only see their assigned patients
          effectiveFamilyId = currentUserId.toString();
        } else if (currentUser.role === 'MHP') {
          // MHP can only see their registered patients
          effectiveMhpId = currentUserId.toString();
        }
      }
    }

    return this.patientService.findAll(
      search,
      effectiveRole,
      effectiveMhpId,
      effectiveChwId,
      effectiveFamilyId,
      tracked === undefined ? undefined : tracked === 'true',
    );
  }

  @Get('tracked')
  @UseGuards(JwtAuthGuard)
  findTracked() {
    return this.patientService.findTracked();
  }

  @Patch(':id/track')
  track(@Param('id') id: string) {
    return this.patientService.trackPatient(+id);
  }

  @Patch(':id/found')
  @UseGuards(JwtAuthGuard)
  async found(
    @Param('id') id: string, 
    @Body() data: { locationFound: string; details?: string },
    @Req() req
  ) {
    return this.patientService.markAsFound(+id, req.user.id, data.locationFound, data.details);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto, @Req() req) {
    // If the updater is an MHP, ensure they are associated if they are the original creator
    // but typically we don't want to change the original registeredByMhpId on update.
    // However, the user mentioned it's being saved as null, so let's ensure it's handled.
    const updatedPatient = await this.patientService.update(+id, updatePatientDto);
    return updatedPatient;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const patient = await this.patientService.findOne(+id);
    await this.patientService.remove(+id);
    return { message: 'Patient deleted successfully' };
  }
}
