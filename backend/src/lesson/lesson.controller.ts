import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createLessonDto: CreateLessonDto, @Req() req) {
    // Set the creator from authenticated user
    if (req.user && req.user.id) {
      createLessonDto.createdBy = req.user.id;
    }
    return this.lessonService.create(createLessonDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.lessonService.findAll(search, category);
  }

  @Get('categories')
  getCategories() {
    return this.lessonService.getCategories();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonService.findOne(+id);
  }

  @Get(':id/file-info')
  async getFileInfo(@Param('id') id: string) {
    const lesson = await this.lessonService.findOne(+id);
    return {
      id: lesson.id,
      title: lesson.title,
      hasFile: !!lesson.fileUrl,
      fileUrl: lesson.fileUrl,
      fileName: lesson.fileName,
      fileType: lesson.fileType,
      fileSize: lesson.fileSize,
      isAccessible: lesson.fileUrl ? lesson.fileUrl.startsWith('http') : false,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonService.update(+id, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.lessonService.remove(+id);
  }
}
