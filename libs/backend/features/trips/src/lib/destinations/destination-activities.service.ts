import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateDestinationActivityDto } from './create-destination-activity.dto';

@Injectable()
export class DestinationActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivities(userId: string, destinationId: string) {
    await this.assertAccess(userId, destinationId);
    return this.prisma.destinationActivity.findMany({
      where: { destinationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createActivity(userId: string, destinationId: string, dto: CreateDestinationActivityDto) {
    await this.assertAccess(userId, destinationId);
    return this.prisma.destinationActivity.create({
      data: { destinationId, name: dto.name, category: dto.category, notes: dto.notes },
    });
  }

  async toggleDone(userId: string, id: string) {
    const activity = await this.prisma.destinationActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException();
    await this.assertAccess(userId, activity.destinationId);
    return this.prisma.destinationActivity.update({
      where: { id },
      data: { done: !activity.done },
    });
  }

  async deleteActivity(userId: string, id: string) {
    const activity = await this.prisma.destinationActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException();
    await this.assertAccess(userId, activity.destinationId);
    await this.prisma.destinationActivity.delete({ where: { id } });
  }

  private async assertAccess(userId: string, destinationId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      include: { trip: { include: { members: true } } },
    });
    if (!destination) throw new NotFoundException();
    const isMember = destination.trip.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException();
  }
}
