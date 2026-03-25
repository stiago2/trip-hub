import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@org/prisma';
import { CreateDestinationActivityDto } from './create-destination-activity.dto';

@Injectable()
export class DestinationActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivities(userId: string, destinationId: string) {
    await this.assertAccess(userId, destinationId);
    return this.prisma.destinationActivity.findMany({
      where: { destinationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createActivity(userId: string, destinationId: string, dto: CreateDestinationActivityDto) {
    await this.assertAccess(userId, destinationId);
    return this.prisma.destinationActivity.create({
      data: { destinationId, name: dto.name, category: dto.category, notes: dto.notes },
    });
  }

  async toggleDone(userId: string, id: string) {
    const activity = await this.prisma.destinationActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException();
    await this.assertAccess(userId, activity.destinationId);
    return this.prisma.destinationActivity.update({
      where: { id },
      data: { done: !activity.done },
    });
  }

  async deleteActivity(userId: string, id: string) {
    const activity = await this.prisma.destinationActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException();
    await this.assertAccess(userId, activity.destinationId);
    await this.prisma.destinationActivity.delete({ where: { id } });
  }

  async suggestActivities(userId: string, destinationId: string) {
    await this.assertAccess(userId, destinationId);

    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      include: { activities: true },
    });
    if (!destination) throw new NotFoundException();

    const existing = destination.activities.map((a) => a.name).join(', ') || 'none yet';
    const start = destination.startDate.toISOString().split('T')[0];
    const end = destination.endDate.toISOString().split('T')[0];
    const ms = destination.endDate.getTime() - destination.startDate.getTime();
    const days = Math.max(1, Math.round(ms / 86400000) + 1);

    const prompt = `You are a travel expert. Suggest 6 activities for a trip to ${destination.city}, ${destination.country}.
Trip dates: ${start} to ${end} (${days} days).
Activities already planned: ${existing}.

Return ONLY a JSON array (no markdown, no explanation) with exactly this structure:
[
  { "name": "activity name", "category": "CULTURE|FOOD|NATURE|NIGHTLIFE|SHOPPING|OTHER", "reason": "one short sentence why" },
  ...
]

Rules:
- Do not repeat any already planned activity
- Use only the exact category values: CULTURE, FOOD, NATURE, NIGHTLIFE, SHOPPING, OTHER
- Keep names concise (3-6 words max)
- Keep reasons under 12 words`;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      const suggestions = JSON.parse(text);
      return { suggestions };
    } catch {
      return { suggestions: [] };
    }
  }

  private async assertAccess(userId: string, destinationId: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      include: { trip: { include: { members: true } } },
    });
    if (!destination) throw new NotFoundException();
    const isMember = destination.trip.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException();
  }
}
