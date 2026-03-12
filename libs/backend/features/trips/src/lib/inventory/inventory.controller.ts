import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(@Param('tripId') tripId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(tripId, dto);
  }

  @Get()
  findAll(@Param('tripId') tripId: string) {
    return this.inventoryService.findAll(tripId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Patch(':id/toggle')
  togglePacked(@Param('id') id: string) {
    return this.inventoryService.togglePacked(id);
  }
}
