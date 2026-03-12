import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@org/auth';
import { JwtAuthGuard, TripRoleGuard } from '@org/guards';
import { TripRoles } from '@org/decorators';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { AddTripMemberDto } from './dto/add-trip-member.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  createTrip(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTripDto) {
    return this.tripsService.createTrip(user.userId, dto);
  }

  @Get()
  getTrips(@CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.getTrips(user.userId);
  }

  @Get(':id')
  getTripById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tripsService.getTripById(user.userId, id);
  }

  @TripRoles('OWNER', 'EDITOR')
  @UseGuards(TripRoleGuard)
  @Put(':id')
  updateTrip(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.updateTrip(id, dto);
  }

  @TripRoles('OWNER')
  @UseGuards(TripRoleGuard)
  @Delete(':id')
  deleteTrip(@Param('id') id: string) {
    return this.tripsService.deleteTrip(id);
  }

  @TripRoles('OWNER')
  @UseGuards(TripRoleGuard)
  @Post(':id/members')
  addTripMember(@Param('id') id: string, @Body() dto: AddTripMemberDto) {
    return this.tripsService.addTripMember(id, dto);
  }
}
