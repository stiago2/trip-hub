import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '@org/guards';

@Controller()
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('trips/:tripId/activity')
  findByTrip(
    @Param('tripId') tripId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.activityService.findByTrip(tripId, parsedLimit, parsedOffset);
  }
}
