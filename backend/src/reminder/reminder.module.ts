import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, NotificationModule, MailModule],
  controllers: [ReminderController],
  providers: [ReminderService],
})
export class ReminderModule {}
