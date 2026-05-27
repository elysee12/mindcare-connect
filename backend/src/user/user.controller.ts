import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { NotificationService } from '../notification/notification.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto, @Req() req) {
    const user = await this.userService.create(createUserDto);
    await this.notificationService.create({
      type: 'user_created',
      title: 'User Created',
      message: `New user ${user.fullName} (${user.role}) has been created.`,
      metadata: JSON.stringify({ userName: user.fullName, userRole: user.role }),
      userId: req.user.id,
    });
    return user;
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('role') role?: string) {
    return this.userService.findAll(search, role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req) {
    const updatedUser = await this.userService.update(+id, updateUserDto);
    await this.notificationService.create({
      type: 'user_updated',
      title: 'User Updated',
      message: `User ${updatedUser.fullName} has been updated.`,
      metadata: JSON.stringify({ userName: updatedUser.fullName }),
      userId: req.user.id,
    });
    return updatedUser;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req) {
    const user = await this.userService.findOne(+id);
    if (user) {
      await this.userService.remove(+id);
      await this.notificationService.create({
        type: 'user_deleted',
        title: 'User Deleted',
        message: `User ${user.fullName} has been deleted.`,
        metadata: JSON.stringify({ userName: user.fullName }),
        userId: req.user.id,
      });
    }
    return { message: 'User deleted successfully' };
  }
}
