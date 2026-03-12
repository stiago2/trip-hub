import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { CurrentUser } from '@org/auth';
import { AccommodationsService } from './accommodations.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { UpdateAccommodationDto } from './dto/update-accommodation.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class AccommodationsController {
  constructor(private readonly accommodationsService: AccommodationsService) {}

  @Post('destinations/:destinationId/accommodations')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('destinationId') destinationId: string,
    @Body() dto: CreateAccommodationDto,
  ) {
    return this.accommodationsService.create(destinationId, dto, user.userId);
  }

  @Get('trips/:tripId/accommodations')
  findByTrip(@Param('tripId') tripId: string) {
    return this.accommodationsService.findByTrip(tripId);
  }

  @Get('destinations/:destinationId/accommodations')
  findByDestination(@Param('destinationId') destinationId: string) {
    return this.accommodationsService.findByDestination(destinationId);
  }

  @Put('accommodations/:id')
  update(@Param('id') id: string, @Body() dto: UpdateAccommodationDto) {
    return this.accommodationsService.update(id, dto);
  }

  @Delete('accommodations/:id')
  delete(@Param('id') id: string) {
    return this.accommodationsService.delete(id);
  }
}
