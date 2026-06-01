import {
  Controller, Get, Param,
  Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { DateRangeDto, LowStockDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ─────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Stats ─────────────────────────────────────────────────────
  @Get('stats/revenue')
  getRevenue(@Query() dto: DateRangeDto) {
    return this.adminService.getRevenue(dto);
  }

  @Get('stats/orders')
  getOrderStats() {
    return this.adminService.getOrderStats();
  }

  @Get('stats/recent-orders')
  getRecentOrders(@Query('limit') limit = 10) {
    return this.adminService.getRecentOrders(+limit);
  }

  // ── Products ──────────────────────────────────────────────────
  @Get('products/low-stock')
  getLowStock(@Query() dto: LowStockDto) {
    return this.adminService.getLowStockProducts(dto.threshold);
  }

  @Get('products/top-selling')
  getTopProducts(@Query('limit') limit = 10) {
    return this.adminService.getTopProducts(+limit);
  }

  // ── Users ─────────────────────────────────────────────────────
  @Get('users/admins')
  getAdminUsers() {
    return this.adminService.getAdminUsers();
  }

  @Patch('users/:id/promote')
  promoteToAdmin(@Param('id') id: string) {
    return this.adminService.promoteToAdmin(id);
  }

  @Patch('users/:id/demote')
  demoteFromAdmin(@Param('id') id: string) {
    return this.adminService.demoteFromAdmin(id);
  }

  // ── Cache ─────────────────────────────────────────────────────
  @Post('cache/clear')
  clearCache() {
    return this.adminService.clearStatsCache();
  }

  @Get('cache/info')
  getCacheInfo() {
    return this.adminService.getCacheInfo();
  }

  // ── Health (Public for monitoring tools) ──────────────────────
  @Public()
  @Get('health')
  health() {
    return this.adminService.healthCheck();
  }
}
