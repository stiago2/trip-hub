import { Injectable } from '@nestjs/common';
import { PrismaService } from '@org/prisma';

export type ActivityType =
  | 'destination_added'
  | 'accommodation_added'
  | 'transport_added'
  | 'budget_updated'
  | 'trip_updated'
  | 'member_added';

export interface CreateActivityInput {
  tripId: string;
  userId: string;
  type: ActivityType;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateActivityInput) {
    return this.prisma.activity.create({
      data: {
        tripId: input.tripId,
        userId: input.userId,
        type: input.type,
        message: input.message,
        metadata: input.metadata ?? null,
      },
    });
  }

  async findByTrip(tripId: string, limit = 10, offset = 0) {
    const [total, activities] = await this.prisma.$transaction([
      this.prisma.activity.count({ where: { tripId } }),
      this.prisma.activity.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
    ]);

    const items = activities.map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      metadata: a.metadata,
      createdAt: a.createdAt,
      userId: a.userId,
      userName: a.user.name ?? 'Unknown',
      userAvatar: a.user.avatarUrl ?? null,
    }));

    return { items, total };
  }
}
