import { Module } from '@nestjs/common';
import { TripMembersController } from './trip-members.controller';
import { TripMembersService } from './trip-members.service';

@Module({
  controllers: [TripMembersController],
  providers: [TripMembersService],
  exports: [TripMembersService],
})
export class TripMembersModule {}
