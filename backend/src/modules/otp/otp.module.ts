import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
