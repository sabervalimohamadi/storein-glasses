import {
  Body, Controller, ForbiddenException, HttpCode, HttpStatus, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminSetupDto } from './dto/admin-setup.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import type { UserDocument } from '../user/entities/user.schema';
import { UserRole } from '../user/entities/user.schema';

const COOKIE_NAME = 'refresh_token';
const COOKIE_PATH = '/api/v1/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string): void {
    // In production the frontend and backend are on different Railway subdomains
    // (cross-site). SameSite=Strict blocks the cookie on cross-site requests, so
    // the refresh call never receives the cookie → user is logged out on every reload.
    // SameSite=None (requires Secure=true) allows the cookie in cross-origin fetches.
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge:   30 * 24 * 60 * 60 * 1000,
      path:     COOKIE_PATH,
    });
  }

  private clearRefreshCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(COOKIE_NAME, {
      path:     COOKIE_PATH,
      secure:   isProd,
      sameSite: isProd ? 'none' : 'lax',
    });
  }

  @Public() @Post('send-otp') @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public() @Post('verify-otp') @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto, {
      userAgent: req.headers['user-agent'], ip: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, isNewUser: result.isNewUser };
  }

  @Public() @Post('admin-login') @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.adminLogin(dto, {
      userAgent: req.headers['user-agent'], ip: req.ip,
    });
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  /**
   * One-time bootstrap endpoint — sets admin password for a given phone.
   * Requires SEED_SECRET env var; disabled if env var is absent.
   */
  @Public() @Post('admin-setup') @HttpCode(HttpStatus.OK)
  async adminSetup(@Body() dto: AdminSetupDto) {
    const expected = process.env.SEED_SECRET;
    if (!expected || dto.secret !== expected) {
      throw new Error('Forbidden');
    }
    await this.authService.setAdminPassword(dto.phone, dto.password);
    return { message: 'رمز عبور مدیر با موفقیت تنظیم شد' };
  }

  @UseGuards(JwtRefreshGuard) @Post('refresh') @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request & { user: JwtRefreshPayload },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(
      req.user.sub,
      req.user.refreshToken!,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard) @Post('change-password') @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: UserDocument,
    @Body() dto: ChangePasswordDto,
  ) {
    if (!user.isAdmin && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('فقط مدیران ارشد می‌توانند رمز عبور را تغییر دهند');
    }
    await this.authService.changePassword((user._id as any).toString(), dto);
    return { message: 'رمز عبور با موفقیت تغییر یافت' };
  }

  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.[COOKIE_NAME] ?? '';
    this.clearRefreshCookie(res);
    return this.authService.logout((user._id as any).toString(), refreshToken);
  }

  @UseGuards(JwtAuthGuard) @Post('logout-all') @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: UserDocument) {
    return this.authService.logoutAll((user._id as any).toString());
  }
}
