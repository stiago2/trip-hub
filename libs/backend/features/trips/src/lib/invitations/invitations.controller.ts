import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@org/auth';
import { JwtAuthGuard } from '@org/guards';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('trips/:tripId/invitations')
  invite(@Param('tripId') tripId: string, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.invite(tripId, dto);
  }

  @Get('trips/:tripId/invitations')
  findAll(@Param('tripId') tripId: string) {
    return this.invitationsService.findTripInvitations(tripId);
  }

  @Patch('invitations/:invitationId/accept')
  accept(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.invitationsService.accept(invitationId, user.userId);
  }

  @Patch('invitations/:invitationId/decline')
  decline(@Param('invitationId') invitationId: string) {
    return this.invitationsService.decline(invitationId);
  }
}
