import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@org/prisma';
import { TRIP_ROLES_KEY, TripRole } from '@org/decorators';

interface RequestWithUser {
  params: { id: string };
  user: { userId: string };
}

@Injectable()
export class TripRoleGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const tripId = request.params['id'];
    const userId = request.user.userId;

    const membership = await this.prisma.tripMember.findFirst({
      where: { tripId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }

    const requiredRoles = this.reflector.getAllAndOverride<TripRole[] | undefined>(
      TRIP_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRoles && !requiredRoles.includes(membership.role as TripRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
