import { Module } from '@nestjs/common';
import { TreatmentChangeService } from './treatment-change.service';
import { TreatmentChangeController } from './treatment-change.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [TreatmentChangeController],
  providers: [TreatmentChangeService],
})
export class TreatmentChangeModule {}
