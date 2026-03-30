import { Module } from '@nestjs/common';
import { FlightSearchController } from './flight-search.controller';
import { FlightSearchService } from './flight-search.service';

@Module({
  controllers: [FlightSearchController],
  providers: [FlightSearchService],
})
export class FlightSearchModule {}
