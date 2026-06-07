import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ClicksController } from './clicks.controller';
import { ClicksService } from './clicks.service';
import { Click, ClickSchema } from './schemas/click.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Click.name, schema: ClickSchema }]),
    AuthModule,
  ],
  controllers: [ClicksController],
  providers: [ClicksService],
})
export class ClicksModule {}
