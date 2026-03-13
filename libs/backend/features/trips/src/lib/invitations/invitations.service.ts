import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(tripId: string, dto: CreateInvitationDto) {
    const existing = await this.prisma.invitation.findUnique({
      where: { tripId_email: { tripId, email: dto.email } },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new ConflictException('A pending invitation already exists for this email');
      }
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('This user is already a member of the trip');
      }
      // DECLINED — reopen invitation
      return this.prisma.invitation.update({
        where: { id: existing.id },
        data: { status: 'PENDING', role: dto.role, invitedAt: new Date() },
      });
    }

    return this.prisma.invitation.create({
      data: { tripId, email: dto.email, role: dto.role },
    });
  }

  async accept(invitationId: string, userId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    const member = await this.prisma.tripMember.upsert({
      where: { tripId_userId: { tripId: invitation.tripId, userId } },
      create: { tripId: invitation.tripId, userId, role: invitation.role },
      update: { role: invitation.role },
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

  findPendingForUser(email: string) {
    return this.prisma.invitation.findMany({
      where: { email, status: 'PENDING' },
      include: { trip: { select: { id: true, title: true } } },
      orderBy: { invitedAt: 'desc' },
    });
  }
}
