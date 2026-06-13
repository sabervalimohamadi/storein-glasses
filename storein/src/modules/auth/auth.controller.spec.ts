import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockService = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  refreshTokens: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
};

const makeReq = (overrides = {}) => ({
  headers: { 'user-agent': 'jest', authorization: 'Bearer tok' },
  ip: '127.0.0.1',
  user: { sub: 'uid1', refreshToken: 'rtok' },
  cookies: { refresh_token: 'rtok' },
  ...overrides,
});

const makeRes = () => ({
  cookie: jest.fn(),
  clearCookie: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('sendOtp delegates to service', async () => {
    mockService.sendOtp.mockResolvedValue({ message: 'ok', expiresIn: 120 });
    const res = await controller.sendOtp({ phone: '09121234567' });
    expect(res.expiresIn).toBe(120);
    expect(mockService.sendOtp).toHaveBeenCalledWith({ phone: '09121234567' });
  });

  it('sendOtp propagates BadRequestException on rate limit', async () => {
    mockService.sendOtp.mockRejectedValue(new BadRequestException());
    await expect(controller.sendOtp({ phone: '09121234567' })).rejects.toThrow(BadRequestException);
  });

  it('verifyOtp passes user-agent and ip from request', async () => {
    mockService.verifyOtp.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt', isNewUser: false });
    const req = makeReq() as any;
    const res = makeRes() as any;
    await controller.verifyOtp({ phone: '09121234567', code: '123456' }, req, res);
    expect(mockService.verifyOtp).toHaveBeenCalledWith(
      { phone: '09121234567', code: '123456' },
      { userAgent: 'jest', ip: '127.0.0.1' },
    );
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'rt', expect.any(Object));
  });

  it('verifyOtp propagates UnauthorizedException on bad code', async () => {
    mockService.verifyOtp.mockRejectedValue(new UnauthorizedException());
    await expect(
      controller.verifyOtp({ phone: '09121234567', code: 'wrong' }, makeReq() as any, makeRes() as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('refresh delegates refreshToken from cookie', async () => {
    mockService.refreshTokens.mockResolvedValue({ accessToken: 'at2', refreshToken: 'rt2' });
    const req = makeReq() as any;
    const res = makeRes() as any;
    await controller.refresh(req, res);
    expect(mockService.refreshTokens).toHaveBeenCalledWith('uid1', 'rtok', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'rt2', expect.any(Object));
  });

  it('logout reads cookie and clears it', async () => {
    mockService.logout.mockResolvedValue({ message: 'ok' });
    const user = { _id: 'uid1' } as any;
    const res = makeRes() as any;
    await controller.logout(user, makeReq() as any, res);
    expect(mockService.logout).toHaveBeenCalledWith('uid1', 'rtok');
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
  });

  it('logoutAll delegates userId', async () => {
    mockService.logoutAll.mockResolvedValue({ message: 'ok' });
    const user = { _id: 'uid1' } as any;
    await controller.logoutAll(user);
    expect(mockService.logoutAll).toHaveBeenCalledWith('uid1');
  });
});
