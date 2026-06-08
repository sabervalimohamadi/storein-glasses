import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Grants access to Admin role only — managers are excluded. */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.isAdmin) throw new ForbiddenException('دسترسی فقط برای ادمین اصلی');
    return true;
  }
}
