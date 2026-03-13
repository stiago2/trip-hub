import { Module } from '@nestjs/common';
import { PrismaModule } from '@org/prisma';
import { TripRoleGuard } from '@org/guards';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { DestinationsModule } from './destinations/destinations.module';
import { AccommodationsModule } from './accommodations/accommodations.module';
import { InventoryModule } from './inventory/inventory.module';
import { BudgetModule } from './budget/budget.module';
import { TripMembersModule } from './members/trip-members.module';
import { InvitationsModule } from './invitations/invitations.module';
import { TransportModule } from './transport/transport.module';
import { ActivityModule } from './activity/activity.module';
import { DocumentImportModule } from './document-import/document-import.module';

@Module({
  imports: [PrismaModule, DestinationsModule, AccommodationsModule, InventoryModule, BudgetModule, TripMembersModule, InvitationsModule, TransportModule, ActivityModule, DocumentImportModule],
  controllers: [TripsController],
  providers: [TripsService, TripRoleGuard],
})
export class TripsModule {}
