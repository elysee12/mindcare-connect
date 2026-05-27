import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FollowupService } from './followup.service';
import { NotificationService } from '../notification/notification.service';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('patients/:patientId/followups')
export class FollowupController {
  constructor(
    private readonly followupService: FollowupService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Param('patientId') patientId: string, @Body() createFollowupDto: CreateFollowupDto, @Req() req) {
    const followup = await this.followupService.create({ 
      ...createFollowupDto, 
      patientId: +patientId,
      createdById: req.user.id 
    });
    await this.notificationService.create({
      type: 'followup_created',
      title: 'Followup Added',
      message: `Followup for patient ${followup.patient.fullName} has been added.`,
      metadata: JSON.stringify({ patientName: followup.patient.fullName }),
      userId: req.user.id,
    });
    return followup;
  }

  @Get()
  findAll(@Param('patientId') patientId: string) {
    return this.followupService.findByPatient(+patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followupService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFollowupDto: UpdateFollowupDto) {
    return this.followupService.update(+id, updateFollowupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.followupService.remove(+id);
  }
}
