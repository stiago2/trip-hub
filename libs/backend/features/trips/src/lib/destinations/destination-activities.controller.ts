import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@org/auth';
import { JwtAuthGuard } from '@org/guards';
import { DestinationActivitiesService } from './destination-activities.service';
import { CreateDestinationActivityDto } from './create-destination-activity.dto';

interface AuthenticatedUser { userId: string; email: string; }

@UseGuards(JwtAuthGuard)
@Controller()
export class DestinationActivitiesController {
  constructor(private readonly service: DestinationActivitiesService) {}

  @Get('destinations/:destinationId/activities')
  getActivities(@CurrentUser() user: AuthenticatedUser, @Param('destinationId') destinationId: string) {
    return this.service.getActivities(user.userId, destinationId);
  }

  @Post('destinations/:destinationId/activities')
  createActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('destinationId') destinationId: string,
    @Body() dto: CreateDestinationActivityDto,
  ) {
    return this.service.createActivity(user.userId, destinationId, dto);
  }

  @Patch('destination-activities/:id/toggle')
  toggleDone(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.toggleDone(user.userId, id);
  }

  @Delete('destination-activities/:id')
  deleteActivity(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.deleteActivity(user.userId, id);
  }

  @Post('destinations/:destinationId/suggest-activities')
  suggestActivities(@CurrentUser() user: AuthenticatedUser, @Param('destinationId') destinationId: string) {
    return this.service.suggestActivities(user.userId, destinationId);
  }
}
