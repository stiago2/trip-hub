import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateTransportDto } from './dto/create-transport.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async createTransport(tripId: string, dto: CreateTransportDto, userId?: string) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const transport = await this.prisma.transport.create({
      data: {
        tripId,
        type: dto.type,
        fromLocation: dto.fromLocation,
        toLocation: dto.toLocation,
        departureTime: new Date(dto.departureTime),
        arrivalTime: new Date(dto.arrivalTime),
        ...(dto.price !== undefined && { price: dto.price }),
      },
    });

    if (userId) {
      const typeLabel = dto.type.charAt(0) + dto.type.slice(1).toLowerCase();
      this.activityService.create({
        tripId,
        userId,
        type: 'transport_added',
        message: `Added ${typeLabel}: ${dto.fromLocation} to ${dto.toLocation}`,
      }).catch((err) => console.error('[ActivityService] Failed to create activity:', err));
    }

    return transport;
  }

  getTripTransports(tripId: string) {
    return this.prisma.transport.findMany({
      where: { tripId },
      orderBy: { departureTime: 'asc' },
    });
  }

  async deleteTransport(id: string) {
    const transport = await this.prisma.transport.findUnique({ where: { id } });
    if (!transport) {
      throw new NotFoundException('Transport not found');
    }

    return this.prisma.transport.delete({ where: { id } });
  }
}
