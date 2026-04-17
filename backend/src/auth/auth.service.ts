import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.warn(`[auth] login failed: user not found (${email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(password, user.password);
    console.debug(`[auth] login attempt`, { email, passwordMatches: matches });
    if (!matches) {
      console.warn(`[auth] login failed: invalid password (${email})`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    return this.validateUser(email, password);
  }

  async requestOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiry: expiry,
      },
    });

    await this.mailService.sendOtp(email, otp);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otpCode || user.otpCode !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }
}
