import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!required) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!required.includes(user?.role)) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
