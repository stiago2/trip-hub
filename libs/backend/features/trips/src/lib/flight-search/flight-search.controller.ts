import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { FlightSearchService } from './flight-search.service';

@Controller('flights')
@UseGuards(JwtAuthGuard)
export class FlightSearchController {
  constructor(private readonly service: FlightSearchService) {}

  @Get('locations')
  searchLocations(@Query('query') query: string) {
    return this.service.searchLocations(query);
  }

  @Get('search')
  searchFlights(
    @Query('fromId') fromId: string,
    @Query('toId') toId: string,
    @Query('departDate') departDate: string,
    @Query('adults') adults = '1',
    @Query('stops') stops?: string,
    @Query('cabinClass') cabinClass?: string,
  ) {
    return this.service.searchFlights({
      fromId,
      toId,
      departDate,
      adults: parseInt(adults, 10),
      stops,
      cabinClass,
    });
  }
}
