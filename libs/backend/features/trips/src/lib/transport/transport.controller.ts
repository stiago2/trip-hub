import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { CurrentUser } from '@org/auth';
import { TransportService } from './transport.service';
import { CreateTransportDto } from './dto/create-transport.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('trips/:tripId/transport')
  createTransport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateTransportDto,
  ) {
    return this.transportService.createTransport(tripId, dto, user.userId);
  }

  @Get('trips/:tripId/transport')
  getTripTransports(@Param('tripId') tripId: string) {
    return this.transportService.getTripTransports(tripId);
  }

  @Delete('transport/:id')
  deleteTransport(@Param('id') id: string) {
    return this.transportService.deleteTransport(id);
  }
}
