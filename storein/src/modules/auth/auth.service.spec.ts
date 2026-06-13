import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.schema';
import { RefreshToken } from './entities/refresh-token.schema';
import { SmsService } from './sms/sms.service.abstract';
import { REDIS_CLIENT } from '../../redis/redis.module';

const mockUser = { _id: 'uid1', phone: '09121234567', isActive: true };

// Chainable query builder helper
function chainable(resolvedValue: any) {
  const q: any = { select: jest.fn(), lean: jest.fn(), find: jest.fn() };
  q.select.mockReturnValue(q);
  q.lean.mockResolvedValue(resolvedValue);
  q.find.mockReturnValue(q);
  return q;
}

describe('AuthService', () => {
  let service: AuthService;
  let redis: jest.Mocked<any>;

  const userModel = { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() };
  const rtModel = { create: jest.fn(), findOne: jest.fn(), find: jest.fn(), findByIdAndUpdate: jest.fn(), findOneAndUpdate: jest.fn(), updateMany: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue('tok') };
  const configService = {
    get: jest.fn((k: string) => ({
      'otp.length': 6, 'otp.expiresIn': 120,
      'jwt.refreshSecret': 'rs', 'jwt.refreshExpiresIn': '30d',
    }[k])),
  };
  const smsService = { sendOtp: jest.fn() };

  beforeEach(async () => {
    redis = { incr: jest.fn().mockResolvedValue(1), expire: jest.fn(), setex: jest.fn(), get: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: getModelToken(RefreshToken.name), useValue: rtModel },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: SmsService, useValue: smsService },
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('sendOtp', () => {
    it('sends OTP successfully', async () => {
      redis.incr.mockResolvedValue(1);
      userModel.findOne.mockReturnValue(chainable(null));
      const res = await service.sendOtp({ phone: '09121234567' });
      expect(res.expiresIn).toBe(120);
      expect(smsService.sendOtp).toHaveBeenCalledWith('09121234567', expect.any(String));
    });

    it('throws on rate limit exceeded', async () => {
      userModel.findOne.mockReturnValue(chainable(null));
      redis.incr.mockResolvedValue(4);
      await expect(service.sendOtp({ phone: '09121234567' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('throws if OTP expired', async () => {
      redis.incr.mockResolvedValue(1);
      redis.get.mockResolvedValue(null);
      await expect(service.verifyOtp({ phone: '09121234567', code: '123456' }, {}))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws if OTP wrong', async () => {
      redis.incr.mockResolvedValue(1);
      redis.get.mockResolvedValue('999999');
      await expect(service.verifyOtp({ phone: '09121234567', code: '123456' }, {}))
        .rejects.toThrow(UnauthorizedException);
    });

    it('registers new user and returns tokens', async () => {
      redis.incr.mockResolvedValue(1);
      redis.get.mockResolvedValue('123456');
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue(mockUser);
      rtModel.create.mockResolvedValue({});

      const res = await service.verifyOtp({ phone: '09121234567', code: '123456' }, {});
      expect(res.isNewUser).toBe(true);
      expect(res.accessToken).toBe('tok');
    });

    it('logs in existing user', async () => {
      redis.incr.mockResolvedValue(1);
      redis.get.mockResolvedValue('123456');
      userModel.findOne.mockResolvedValue(mockUser);
      rtModel.create.mockResolvedValue({});

      const res = await service.verifyOtp({ phone: '09121234567', code: '123456' }, {});
      expect(res.isNewUser).toBe(false);
      expect(userModel.create).not.toHaveBeenCalled();
    });
  });
});
