import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class TripMembersService {
  constructor(private readonly prisma: PrismaService) {}

  findMembers(tripId: string) {
    return this.prisma.tripMember.findMany({
      where: { tripId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async updateRole(tripId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const member = await this.prisma.tripMember.findFirst({
      where: { id: memberId, tripId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot change the role of the trip owner');

    return this.prisma.tripMember.update({
      where: { id: memberId },
      data: { role: dto.role },
    });
  }

  async remove(tripId: string, memberId: string) {
    const member = await this.prisma.tripMember.findFirst({
      where: { id: memberId, tripId },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove the trip owner');

    return this.prisma.tripMember.delete({ where: { id: memberId } });
  }
}
