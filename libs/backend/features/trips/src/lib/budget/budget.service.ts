import { Injectable } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async create(tripId: string, dto: CreateBudgetItemDto, userId?: string) {
    const item = await this.prisma.budgetItem.create({
      data: {
        tripId,
        title: dto.title,
        amount: dto.amount,
        category: dto.category,
        paidByUserId: dto.paidByUserId,
      },
    });

    if (userId) {
      this.activityService.create({
        tripId,
        userId,
        type: 'budget_updated',
        message: `Added budget item: ${dto.title}`,
      }).catch(() => undefined);
    }

    return item;
  }

  findAll(tripId: string) {
    return this.prisma.budgetItem.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });
  }

  update(id: string, dto: UpdateBudgetItemDto) {
    return this.prisma.budgetItem.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.budgetItem.delete({
      where: { id },
    });
  }
}
