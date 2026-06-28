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
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  // ── Public ────────────────────────────────────────────────────

  @Get('active')
  async getActive() {
    const discounts = await this.service.getActiveDiscounts();
    return { data: discounts };
  }

  // ── User: validate coupon code ────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  async validateCoupon(
    @CurrentUser() user: any,
    @Body() dto: ValidateDiscountDto,
  ) {
    const result = await this.service.validateCoupon(
      user._id.toString(),
      dto.code,
      dto.cartTotal,
    );
    return { data: result };
  }

  // ── Admin ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() dto: CreateDiscountDto) {
    const discount = await this.service.create(dto);
    return { data: discount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async findAll(
    @Query('page')     page      = '1',
    @Query('limit')    limit     = '20',
    @Query('isActive') isActive?: string,
    @Query('kind')     kind?:     string,
    @Query('hasCode')  hasCode?:  string,
  ) {
    const result = await this.service.findAll({
      page:     Number(page),
      limit:    Number(limit),
      isActive: isActive === undefined ? undefined : isActive === 'true',
      kind,
      hasCode:  hasCode === undefined ? undefined : hasCode === 'true',
    });
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
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
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
  async softDelete(@Param('id') id: string): Promise<void> {
    await this.service.softDelete(id);
  }
}
