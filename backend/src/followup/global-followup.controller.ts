import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { FollowupService } from './followup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('followups')
export class GlobalFollowupController {
  constructor(
    private readonly followupService: FollowupService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Req() req,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('mhpId') mhpId?: string,
    @Query('chwId') chwId?: string,
  ) {
    const currentUserId = req.user.id;
    let effectiveMhpId = mhpId ? +mhpId : undefined;
    let effectiveChwId = chwId ? +chwId : undefined;

    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (currentUser) {
      if (currentUser.role === 'CHW') {
        // CHWs can only see their own reports
        effectiveChwId = currentUserId;
        effectiveMhpId = undefined; // Ensure they don't see MHP scoped data
      } else if (currentUser.role === 'MHP' && !mhpId && !chwId) {
        // MHPs see reports for their patients by default
        effectiveMhpId = currentUserId;
      }
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.followupService.findAllGlobal(effectiveMhpId, search, start, end, effectiveChwId);
  }
}
