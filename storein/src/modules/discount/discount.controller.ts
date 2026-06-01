import {
  Body, Controller, Get, Param,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserDocument } from '../user/entities/user.schema';

const uid = (u: UserDocument) => (u._id as any).toString();

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  // ── User: validate coupon ─────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  validate(@CurrentUser() user: UserDocument, @Body() dto: ValidateCouponDto) {
    return this.discountService.validate(uid(user), dto.code, dto.cartTotal);
  }

  // ── Admin CRUD ────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.discountService.adminCreate(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.discountService.adminFindAll(+page, +limit, active);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.discountService.adminFindById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.discountService.adminUpdate(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.discountService.adminDeactivate(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id/usages')
  getUsage(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.discountService.adminGetUsage(id, +page, +limit);
  }
}
