import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddTripMemberDto } from './dto/add-trip-member.dto';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrip(userId: string, dto: CreateTripDto) {
    return this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          title: dto.title,
          destination: dto.destination,
          description: dto.description,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          ownerId: userId,
        },
      });

      await tx.tripMember.create({
        data: { tripId: trip.id, userId, role: 'OWNER' },
      });

      return trip;
    });
  }

  getTrips(userId: string) {
    return this.prisma.trip.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
    });
  }

  async getTripById(userId: string, tripId: string) {
    const membership = await this.prisma.tripMember.findFirst({
      where: { tripId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this trip');
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: { include: { user: true } } },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  updateTrip(tripId: string, dto: UpdateTripDto) {
    return this.prisma.trip.update({
      where: { id: tripId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.destination !== undefined && { destination: dto.destination }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  deleteTrip(tripId: string) {
    return this.prisma.trip.delete({ where: { id: tripId } });
  }

  async addTripMember(tripId: string, dto: AddTripMemberDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException(`No user found with email ${dto.email}`);
    }

    return this.prisma.tripMember.create({
      data: { tripId, userId: targetUser.id, role: dto.role },
    });
  }
}
