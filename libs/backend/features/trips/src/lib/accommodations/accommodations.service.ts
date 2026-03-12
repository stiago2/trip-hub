import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class AccommodationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(destinationId: string, dto: CreateAccommodationDto, userId?: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    const accommodation = await this.prisma.accommodation.create({
      data: {
        destinationId,
        tripId: destination.tripId,
        name: dto.name,
        checkIn: new Date(dto.checkIn),
        checkOut: new Date(dto.checkOut),
        address: dto.address ?? null,
        price: dto.price ?? null,
      },
    });

    if (userId) {
      this.activityService.create({
        tripId: destination.tripId,
        userId,
        type: 'accommodation_added',
        message: `Added accommodation: ${dto.name}`,
      }).catch(() => undefined);
    }

    return accommodation;
  }

  findByDestination(destinationId: string) {
    return this.prisma.accommodation.findMany({
      where: { destinationId },
      orderBy: { checkIn: 'asc' },
    });
  }

  findByTrip(tripId: string) {
    return this.prisma.accommodation.findMany({
      where: { tripId },
      orderBy: { checkIn: 'asc' },
    });
  }

  async update(id: string, dto: UpdateAccommodationDto) {
    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id },
    });
    if (!accommodation) {
      throw new NotFoundException('Accommodation not found');
    }

    return this.prisma.accommodation.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.checkIn !== undefined && { checkIn: new Date(dto.checkIn) }),
        ...(dto.checkOut !== undefined && { checkOut: new Date(dto.checkOut) }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.price !== undefined && { price: dto.price }),
      },
    });
  }

  async delete(id: string) {
    const accommodation = await this.prisma.accommodation.findUnique({
      where: { id },
    });
    if (!accommodation) {
      throw new NotFoundException('Accommodation not found');
    }

    return this.prisma.accommodation.delete({ where: { id } });
  }
}
