import { Controller, Get, Post, Body, Query, UseGuards, Req, Patch, Param, Delete } from '@nestjs/common';
import { ReportService } from './report.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reports')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createReportDto: CreateReportDto, @Req() req) {
    const report = await this.reportService.create(createReportDto);
    await this.notificationService.create({
      type: 'report_submitted',
      title: 'Report Submitted',
      message: `A new report has been submitted.`,
      metadata: JSON.stringify({ reportTitle: report.title }),
      userId: req.user.id,
    });
    return report;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('mhpId') mhpId?: string,
    @Query('chwId') chwId?: string,
    @Query('timeframe') timeframe?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Req() req?: any,
  ) {
    const currentUserId = req?.user?.id;
    let effectiveMhpId = mhpId && !isNaN(+mhpId) ? +mhpId : undefined;
    let effectiveChwId = chwId && !isNaN(+chwId) ? +chwId : undefined;

    if (currentUserId && !effectiveMhpId && !effectiveChwId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
      });

      if (currentUser) {
        if (currentUser.role === 'MHP') {
          effectiveMhpId = currentUserId;
        } else if (currentUser.role === 'CHW') {
          effectiveChwId = currentUserId;
        }
      }
    }

    if (timeframe && !search && !startDate && !endDate) {
      return this.reportService.getStats(effectiveMhpId);
    }
    
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.reportService.findAll(effectiveMhpId, search, start, end, effectiveChwId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateReportDto: Partial<CreateReportDto>) {
    return this.reportService.update(+id, updateReportDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.reportService.remove(+id);
  }
}
