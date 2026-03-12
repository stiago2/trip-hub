import { Module } from '@nestjs/common';
import { PrismaModule } from '@org/prisma';
import { AuthModule } from '@org/auth';
import { TripsModule } from '@org/trips';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [PrismaModule, AuthModule, TripsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
