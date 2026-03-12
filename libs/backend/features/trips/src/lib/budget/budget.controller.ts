import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@org/guards';
import { CurrentUser } from '@org/auth';
import { BudgetService } from './budget.service';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateBudgetItemDto,
  ) {
    return this.budgetService.create(tripId, dto, user.userId);
  }

  @Get()
  findAll(@Param('tripId') tripId: string) {
    return this.budgetService.findAll(tripId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBudgetItemDto) {
    return this.budgetService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.budgetService.remove(id);
  }
}
