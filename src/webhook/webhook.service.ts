import { Injectable } from '@nestjs/common';
import { ReplyService } from '../ai/reply.service';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { processWebhookEventUseCase } from './use-cases/process-webhook-event.use-case';
import { verifyWebhookUseCase } from './use-cases/verify-webhook.use-case';

export interface VerifyParams {
  mode: string;
  verifyToken: string;
  challenge: string;
}

@Injectable()
export class WebhookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly replyService: ReplyService,
    private readonly eventsService: EventsService,
  ) {}

  verify({ mode, verifyToken, challenge }: VerifyParams): string {
    return verifyWebhookUseCase({
      expectedToken: process.env.META_VERIFY_TOKEN ?? '',
      mode,
      verifyToken,
      challenge,
    });
  }

  processEvent(rawBody: Buffer, signature?: string): { received: true } {
    return processWebhookEventUseCase(rawBody, signature, {
      prisma: this.prisma,
      appSecret: process.env.META_APP_SECRET ?? '',
      processIncomingMessage: (conversationId) =>
        this.replyService.processIncomingMessage(conversationId),
      emitMessageEvent: (conversationId) =>
        this.eventsService.emit('message', conversationId),
      emitConversationEvent: (conversationId) =>
        this.eventsService.emit('conversation', conversationId),
    });
  }
}