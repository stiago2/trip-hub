import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateDestinationDto } from './create-destination.dto';
import { UpdateDestinationDto } from './update-destination.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class DestinationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  private async assertMembership(userId: string, tripId: string) {
    const membership = await this.prisma.tripMember.findFirst({
      where: { userId, tripId },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }
    return membership;
  }

  private async assertEditorOrOwner(userId: string, tripId: string) {
    const membership = await this.assertMembership(userId, tripId);
    if (membership.role === 'VIEWER') {
      throw new ForbiddenException('Only owners and editors can modify destinations');
    }
  }

  async createDestination(userId: string, tripId: string, dto: CreateDestinationDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.assertEditorOrOwner(userId, tripId);

    const destination = await this.prisma.destination.create({
      data: {
        tripId,
        country: dto.country,
        city: dto.city,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes ?? null,
        order: dto.order ?? 0,
      },
    });

    this.activityService.create({
      tripId,
      userId,
      type: 'destination_added',
      message: `Added ${dto.city}, ${dto.country} as a destination`,
    }).catch((err) => console.error('[ActivityService] destination create failed:', err));

    return destination;
  }

  async getDestinations(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.assertMembership(userId, tripId);

    return this.prisma.destination.findMany({
      where: { tripId },
      orderBy: { order: 'asc' },
    });
  }

  async updateDestination(userId: string, destinationId: string, dto: UpdateDestinationDto) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) throw new NotFoundException('Destination not found');
    await this.assertEditorOrOwner(userId, destination.tripId);

    return this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async deleteDestination(userId: string, destinationId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) throw new NotFoundException('Destination not found');
    await this.assertEditorOrOwner(userId, destination.tripId);

    return this.prisma.destination.delete({ where: { id: destinationId } });
  }
}
