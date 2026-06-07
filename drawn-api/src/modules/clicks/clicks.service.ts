import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Click, ClickDocument } from './schemas/click.schema';

@Injectable()
export class ClicksService {
  constructor(@InjectModel(Click.name) private clickModel: Model<ClickDocument>) {}

  async registerClick(userId: string, username: string): Promise<void> {
    const localStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
    const date = new Date(localStr + 'T00:00:00.000Z');

    await this.clickModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      { $inc: { count: 1 }, $setOnInsert: { username } },
      { upsert: true },
    );
  }

  async getSummary(from?: string, to?: string): Promise<{ total: number }> {
    const match = this.buildDateMatch(from, to);
    const result = await this.clickModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);
    return { total: result[0]?.total ?? 0 };
  }

  async getRanking(
    from?: string,
    to?: string,
    limit = 10,
  ): Promise<{ userId: string; username: string; total: number }[]> {
    const match = this.buildDateMatch(from, to);
    return this.clickModel.aggregate([
      { $match: match },
      { $group: { _id: '$userId', username: { $first: '$username' }, total: { $sum: '$count' } } },
      { $sort: { total: -1 } },
      { $limit: limit },
      { $project: { _id: 0, userId: '$_id', username: 1, total: 1 } },
    ]);
  }

  private buildDateMatch(from?: string, to?: string): Record<string, unknown> {
    if (!from && !to) return {};
    const date: Record<string, Date> = {};
    if (from) date.$gte = new Date(from);
    if (to) date.$lte = new Date(to);
    return { date };
  }
}
