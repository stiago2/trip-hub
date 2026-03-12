import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@org/auth';
import { JwtAuthGuard } from '@org/guards';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './create-destination.dto';
import { UpdateDestinationDto } from './update-destination.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post('trips/:tripId/destinations')
  createDestination(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateDestinationDto,
  ) {
    return this.destinationsService.createDestination(user.userId, tripId, dto);
  }

  @Get('trips/:tripId/destinations')
  getDestinations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    return this.destinationsService.getDestinations(user.userId, tripId);
  }

  @Put('destinations/:id')
  updateDestination(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationsService.updateDestination(user.userId, id, dto);
  }

  @Delete('destinations/:id')
  deleteDestination(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.destinationsService.deleteDestination(user.userId, id);
  }
}
