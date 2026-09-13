import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { MetaModule } from '../meta/meta.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [MetaModule, AiModule],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationsModule {}
