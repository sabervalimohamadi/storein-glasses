import {
  Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import type { UserDocument } from '../user/entities/user.schema';

const COOKIE_NAME = 'refresh_token';
const COOKIE_PATH = '/api/v1/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: COOKIE_PATH,
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

  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: UserDocument,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req as any).cookies?.[COOKIE_NAME] ?? '';
    res.clearCookie(COOKIE_NAME, { path: COOKIE_PATH });
    return this.authService.logout((user._id as any).toString(), refreshToken);
  }

  @UseGuards(JwtAuthGuard) @Post('logout-all') @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: UserDocument) {
    return this.authService.logoutAll((user._id as any).toString());
  }
}
