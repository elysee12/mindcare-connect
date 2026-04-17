import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { UpdateSystemLogDto } from './dto/update-system-log.dto';

@Controller('system-logs')
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Post()
  create(@Body() createSystemLogDto: CreateSystemLogDto) {
    return this.systemLogService.create(createSystemLogDto);
  }

  @Get()
  findAll() {
    return this.systemLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemLogService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSystemLogDto: UpdateSystemLogDto) {
    return this.systemLogService.update(+id, updateSystemLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemLogService.remove(+id);
  }

  @Delete()
  clearAll() {
    return this.systemLogService.clearAll();
  }
}
