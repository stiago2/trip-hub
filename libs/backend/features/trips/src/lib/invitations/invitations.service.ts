import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(tripId: string, dto: CreateInvitationDto) {
    const existing = await this.prisma.invitation.findFirst({
      where: { tripId, email: dto.email, status: 'PENDING' },
    });
    if (existing) throw new ConflictException('A pending invitation already exists for this email');

    return this.prisma.invitation.create({
      data: {
        tripId,
        email: dto.email,
        role: dto.role,
      },
    });
  }

  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const member = await this.prisma.tripMember.create({
      data: {
        tripId: invitation.tripId,
        userId,
        role: invitation.role,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    return member;
  }

  decline(invitationId: string) {
    return this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' },
    });
  }

  findTripInvitations(tripId: string) {
    return this.prisma.invitation.findMany({
      where: { tripId },
      orderBy: { invitedAt: 'desc' },
    });
  }
}
