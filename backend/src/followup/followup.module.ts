import { Module } from '@nestjs/common';
import { FollowupService } from './followup.service';
import { FollowupController } from './followup.controller';
import { GlobalFollowupController } from './global-followup.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [FollowupController, GlobalFollowupController],
  providers: [FollowupService],
})
export class FollowupModule {}
