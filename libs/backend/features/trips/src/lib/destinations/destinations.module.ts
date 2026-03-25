import { Module } from '@nestjs/common';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { ActivityModule } from '../activity/activity.module';
import { DestinationActivitiesController } from './destination-activities.controller';
import { DestinationActivitiesService } from './destination-activities.service';

@Module({
  imports: [ActivityModule],
  controllers: [DestinationsController, DestinationActivitiesController],
  providers: [DestinationsService, DestinationActivitiesService],
})
export class DestinationsModule {}
