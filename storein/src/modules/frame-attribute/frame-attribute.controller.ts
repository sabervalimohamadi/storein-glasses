import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FrameAttributeService } from './frame-attribute.service';
import { CreateFrameAttributeDto } from './dto/create-frame-attribute.dto';
import { UpdateFrameAttributeDto } from './dto/update-frame-attribute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('frame-attributes')
export class FrameAttributeController {
  constructor(private readonly service: FrameAttributeService) {}

  @Get()
  findActive(@Query('type') type: string) {
    return this.service.findActive(type);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminFindAll(@Query('type') type: string) {
    return this.service.adminFindAll(type);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateFrameAttributeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateFrameAttributeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
