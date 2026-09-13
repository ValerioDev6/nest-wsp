import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MetaModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
