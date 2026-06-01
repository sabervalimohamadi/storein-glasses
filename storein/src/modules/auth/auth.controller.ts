import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshPayload } from './interfaces/jwt-payload.interface';
import type { UserDocument } from '../user/entities/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() @Post('send-otp') @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public() @Post('verify-otp') @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    return this.authService.verifyOtp(dto, {
      userAgent: req.headers['user-agent'], ip: req.ip,
    });
  }

  @UseGuards(JwtRefreshGuard) @Post('refresh') @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request & { user: JwtRefreshPayload }) {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken!, {
      userAgent: req.headers['user-agent'], ip: req.ip,
    });
  }

  @UseGuards(JwtAuthGuard) @Post('logout') @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: UserDocument, @Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '').trim() ?? '';
    return this.authService.logout((user._id as any).toString(), token);
  }

  @UseGuards(JwtAuthGuard) @Post('logout-all') @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: UserDocument) {
    return this.authService.logoutAll((user._id as any).toString());
  }
}
