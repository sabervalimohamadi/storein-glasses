import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('colors')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ColorController {
  constructor(private readonly colorService: ColorService) {}

  @Get()
  @Public()
  findAll() {
    return this.colorService.findAll();
  }

  @Get('admin/all')
  adminFindAll() {
    return this.colorService.adminFindAll();
  }

  @Post()
  create(@Body() dto: CreateColorDto) {
    return this.colorService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateColorDto) {
    return this.colorService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.colorService.remove(id);
  }
}
