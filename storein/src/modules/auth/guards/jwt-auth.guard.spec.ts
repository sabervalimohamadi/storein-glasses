import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

const makeCtx = (handler = {}, cls = {}): ExecutionContext =>
  ({ getHandler: () => handler, getClass: () => cls } as any);

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new JwtAuthGuard(reflector);
  });

  describe('canActivate', () => {
    it('returns true immediately for @Public() routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      expect(guard.canActivate(makeCtx())).toBe(true);
    });

    it('delegates to passport AuthGuard for protected routes', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true);
      guard.canActivate(makeCtx());
      expect(superActivate).toHaveBeenCalled();
      superActivate.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('returns the user when valid', () => {
      const user = { _id: 'u1', phone: '09120000000' };
      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('throws UnauthorizedException when user is falsy', () => {
      expect(() => guard.handleRequest(null, null))
        .toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when error is passed', () => {
      expect(() => guard.handleRequest(new Error('jwt expired'), null))
        .toThrow(UnauthorizedException);
    });
  });
});
