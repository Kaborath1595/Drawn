import { Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClicksFilterDto, ClicksRankingDto } from './dto/clicks-filter.dto';
import { ClicksService } from './clicks.service';

interface AuthRequest {
  user: { userId: string; username: string };
}

@SkipThrottle()
@Controller('clicks')
export class ClicksController {
  constructor(private clicksService: ClicksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  registerClick(@Request() req: AuthRequest) {
    return this.clicksService.registerClick(req.user.userId, req.user.username);
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('specialist')
  getSummary(@Query() query: ClicksFilterDto) {
    return this.clicksService.getSummary(query.from, query.to);
  }

  @Get('ranking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('specialist')
  getRanking(@Query() query: ClicksRankingDto) {
    return this.clicksService.getRanking(query.from, query.to, query.limit);
  }
}
