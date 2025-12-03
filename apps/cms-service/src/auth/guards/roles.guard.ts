import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.getRequiredRoles(context);
    if (!requiredRoles?.length) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.roles) {
      return false;
    }

    return requiredRoles.some((role) => user.roles.includes(role));
  }

  private getRequiredRoles(context: ExecutionContext): Role[] | undefined {
    return (
      this.reflector.get<Role[]>(ROLES_KEY, context.getHandler()) ??
      this.reflector.get<Role[]>(ROLES_KEY, context.getClass())
    );
  }
}

