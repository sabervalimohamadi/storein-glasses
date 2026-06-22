import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TimeDiscountService } from './time-discount.service';
import { CreateTimeDiscountDto } from './dto/create-time-discount.dto';
import { UpdateTimeDiscountDto } from './dto/update-time-discount.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('time-discounts')
export class TimeDiscountController {
  constructor(private readonly service: TimeDiscountService) {}

  // ── Public ────────────────────────────────────────────────────
  @Get('active')
  async getActive() {
    const discounts = await this.service.getActiveDiscounts();
    return { data: discounts };
  }

  // ── Admin ─────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() dto: CreateTimeDiscountDto) {
    const discount = await this.service.create(dto);
    return { data: discount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.service.findAll(
      Number(page),
      Number(limit),
      isActive === undefined ? undefined : isActive === 'true',
    );
    return { data: result };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const discount = await this.service.findById(id);
    return { data: discount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTimeDiscountDto) {
    const discount = await this.service.update(id, dto);
    return { data: discount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/toggle')
  async toggle(@Param('id') id: string) {
    const discount = await this.service.toggle(id);
    return { data: discount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
