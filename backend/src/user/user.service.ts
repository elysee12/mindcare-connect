import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(`A user with email "${createUserDto.email}" already exists. Please use a different email address.`);
    }

    const password = createUserDto.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          workplace: true,
          district: true,
          sector: true,
          cell: true,
          village: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Send welcome email
      try {
        console.log(`[UserService] ✅ User created: ${user.email} (${user.role})`);
        console.log(`[UserService] Sending welcome email to ${user.email}...`);
        await this.mailService.sendWelcomeEmail(
          user.email,
          user.fullName,
          user.role,
          password,
        );
        console.log(`[UserService] ✅ Welcome email sent successfully to ${user.email}`);
      } catch (emailError) {
        console.error(`[UserService] ⚠️  Email sending failed for ${user.email}:`, emailError.message);
        console.error(`[UserService] Full error:`, emailError);
        // Don't re-throw - user was created successfully, email failure is secondary
      }

      return user;
    } catch (error: any) {
      // Handle unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'email';
        throw new ConflictException(`A user with this ${field} already exists.`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  async findAll(search?: string, role?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (role) {
      where.role = role;
    }

    return this.prisma.user.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        workplace: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        workplace: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // Hash password if provided
    const data = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        workplace: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
