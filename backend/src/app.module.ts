import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { PatientModule } from './patient/patient.module';
import { FollowupModule } from './followup/followup.module';
import { NotificationModule } from './notification/notification.module';
import { ReminderModule } from './reminder/reminder.module';
import { TreatmentChangeModule } from './treatment-change/treatment-change.module';
import { SystemLogModule } from './system-log/system-log.module';
import { ReportModule } from './report/report.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [PrismaModule, NotificationModule, UserModule, PatientModule, FollowupModule, ReminderModule, TreatmentChangeModule, SystemLogModule, ReportModule, AuthModule, UploadModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
