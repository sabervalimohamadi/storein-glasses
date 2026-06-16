import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../user/entities/user.schema';

const mockService = {
  sendOtp:          jest.fn(),
  verifyOtp:        jest.fn(),
  adminLogin:       jest.fn(),
  setAdminPassword: jest.fn(),
  changePassword:   jest.fn(),
  refreshTokens:    jest.fn(),
  logout:           jest.fn(),
  logoutAll:        jest.fn(),
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

  describe('adminLogin', () => {
    it('returns accessToken and sets refresh cookie', async () => {
      mockService.adminLogin.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });
      const req = makeReq() as any;
      const res = makeRes() as any;
      const result = await controller.adminLogin(
        { phone: '09121234567', password: 'secret123' },
        req,
        res,
      );
      expect(result).toEqual({ accessToken: 'at' });
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'rt', expect.any(Object));
      expect(mockService.adminLogin).toHaveBeenCalledWith(
        { phone: '09121234567', password: 'secret123' },
        { userAgent: 'jest', ip: '127.0.0.1' },
      );
    });

    it('propagates UnauthorizedException on wrong credentials', async () => {
      mockService.adminLogin.mockRejectedValue(new UnauthorizedException());
      await expect(
        controller.adminLogin(
          { phone: '09121234567', password: 'wrong' },
          makeReq() as any,
          makeRes() as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('adminSetup', () => {
    const originalEnv = process.env.SEED_SECRET;

    beforeEach(() => { process.env.SEED_SECRET = 'test-secret'; });
    afterEach(() =>  { process.env.SEED_SECRET = originalEnv; });

    it('sets admin password when secret matches', async () => {
      mockService.setAdminPassword.mockResolvedValue(undefined);
      const result = await controller.adminSetup({
        phone: '09121234567', password: 'newpass1', secret: 'test-secret',
      });
      expect(result).toEqual({ message: 'رمز عبور مدیر با موفقیت تنظیم شد' });
      expect(mockService.setAdminPassword).toHaveBeenCalledWith('09121234567', 'newpass1');
    });

    it('throws when secret is wrong', async () => {
      await expect(
        controller.adminSetup({ phone: '09121234567', password: 'p', secret: 'bad-secret' }),
      ).rejects.toThrow();
      expect(mockService.setAdminPassword).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const dto = { currentPassword: 'OldPass#1', newPassword: 'NewPass#2' };
    const adminUser  = { _id: 'uid1', isAdmin: true,  role: UserRole.ADMIN   } as any;
    const managerUser = { _id: 'uid2', isAdmin: false, role: UserRole.MANAGER } as any;
    const regularUser = { _id: 'uid3', isAdmin: false, role: UserRole.USER   } as any;

    it('returns success message when admin changes password', async () => {
      mockService.changePassword.mockResolvedValue(undefined);
      const result = await controller.changePassword(adminUser, dto);
      expect(result).toEqual({ message: 'رمز عبور با موفقیت تغییر یافت' });
      expect(mockService.changePassword).toHaveBeenCalledWith('uid1', dto);
    });

    it('throws ForbiddenException when manager tries to change password', async () => {
      await expect(controller.changePassword(managerUser, dto))
        .rejects.toThrow(ForbiddenException);
      expect(mockService.changePassword).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when regular user tries to change password', async () => {
      await expect(controller.changePassword(regularUser, dto))
        .rejects.toThrow(ForbiddenException);
      expect(mockService.changePassword).not.toHaveBeenCalled();
    });

    it('propagates UnauthorizedException from service on wrong current password', async () => {
      mockService.changePassword.mockRejectedValue(new UnauthorizedException());
      await expect(controller.changePassword(adminUser, dto))
        .rejects.toThrow(UnauthorizedException);
    });

    it('propagates BadRequestException from service on same password', async () => {
      mockService.changePassword.mockRejectedValue(new BadRequestException());
      await expect(controller.changePassword(adminUser, dto))
        .rejects.toThrow(BadRequestException);
    });
  });
});
