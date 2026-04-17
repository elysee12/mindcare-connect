import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { FollowupService } from './followup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('followups')
export class GlobalFollowupController {
  constructor(private readonly followupService: FollowupService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const mhpId = req.user.id;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.followupService.findAllGlobal(mhpId, search, start, end);
  }
}
