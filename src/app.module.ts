import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { ConversationsModule } from './conversations/conversation.module';
import { EventsModule } from './events/events.module';
import { MetaModule } from './meta/meta.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    PrismaModule,
    ConversationsModule,
    WebhookModule,
    MetaModule,
    AiModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
