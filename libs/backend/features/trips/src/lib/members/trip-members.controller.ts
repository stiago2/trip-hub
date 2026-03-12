import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { TripMembersService } from './trip-members.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/members')
export class TripMembersController {
  constructor(private readonly tripMembersService: TripMembersService) {}

  @Post('invite')
  invite(@Param('tripId') tripId: string, @Body() dto: InviteMemberDto) {
    return this.tripMembersService.invite(tripId, dto);
  }

  @Get()
  findMembers(@Param('tripId') tripId: string) {
    return this.tripMembersService.findMembers(tripId);
  }

  @Patch(':memberId')
  updateRole(
    @Param('tripId') tripId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tripMembersService.updateRole(tripId, memberId, dto);
  }

  @Delete(':memberId')
  remove(@Param('tripId') tripId: string, @Param('memberId') memberId: string) {
    return this.tripMembersService.remove(tripId, memberId);
  }
}
