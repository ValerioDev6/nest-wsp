import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenRouterService } from './openrouter.service';
import { ReplyService } from './reply.service';
import { MetaModule } from '../meta/meta.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [HttpModule, MetaModule, BotModule],
  providers: [OpenRouterService, ReplyService],
  exports: [OpenRouterService, ReplyService],
})
export class AiModule {}
