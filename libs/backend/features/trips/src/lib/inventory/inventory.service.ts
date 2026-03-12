import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(tripId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: {
        tripId,
        name: dto.name,
        category: dto.category,
        quantity: dto.quantity,
        packed: false,
      },
    });
  }

  findAll(tripId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tripId },
      orderBy: { name: 'asc' },
    });
  }

  update(id: string, dto: UpdateInventoryItemDto) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.inventoryItem.delete({
      where: { id },
    });
  }

  async togglePacked(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: { packed: !item.packed },
    });
  }
}
