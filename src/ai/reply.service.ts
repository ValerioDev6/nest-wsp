import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BotService } from '../bot/bot.service';
import { MetaService } from '../meta/meta.service';
import { OpenRouterService } from './openrouter.service';
import { EventsService } from '../events/events.service';
import { buildHistoryUseCase } from './use-cases/build-history.use-case';
import {
  isContactRequest,
  CONTACT_BLOCK,
} from '../bot/use-cases/run-bot-flow.use-case';

@Injectable()
export class ReplyService {
  private readonly logger = new Logger(ReplyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly botService: BotService,
    private readonly openRouterService: OpenRouterService,
    private readonly metaService: MetaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Despacha la respuesta según el modo de la conversación:
   * - BOT:    bot de reglas/menú.
   * - HUMANO: el operador responde a mano, el bot se queda callado.
   * - IA:     OpenRouter responde solo, salvo que pidan asesor humano.
   */
  async processIncomingMessage(conversationId: string): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return false;
    }

    if (conversation.mode === 'HUMANO') {
      return false;
    }

    if (conversation.mode === 'IA') {
      return this.replyWithIa(conversationId);
    }

    return this.botService.tryHandle(conversationId);
  }

  private async replyWithIa(conversationId: string): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return false;
    }

    const lastMessage = await this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastMessage || lastMessage.role !== 'user') {
      return false;
    }

    const text = lastMessage.content ?? '';

    // Si el cliente pide asesor humano, la conversación pasa a modo HUMANO
    // para que el operador entre a chatear.
    if (isContactRequest(text)) {
      try {
        await this.prisma.message.create({
          data: {
            conversationId,
            content: CONTACT_BLOCK,
            role: 'assistant',
          },
        });
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { mode: 'HUMANO', botState: null, lastActivity: new Date() },
        });
        await this.metaService.sendTextMessage(
          conversation.phoneNumber,
          CONTACT_BLOCK,
        );
        this.eventsService.emit('message', conversationId);
        this.eventsService.emit('conversation', conversationId);
        return true;
      } catch (error) {
        this.logger.error(
          `Error al derivar a humano en ${conversationId}`,
          error instanceof Error ? error.stack : String(error),
        );
        return false;
      }
    }

    if (!this.openRouterService.isConfigured) {
      this.logger.warn(
        `Modo IA para ${conversationId} pero OpenRouter no está configurado`,
      );
      return false;
    }

    try {
      const history = await buildHistoryUseCase({
        prisma: this.prisma,
        conversationId,
      });
      const reply = await this.openRouterService.generateReply(history);
      await this.prisma.message.create({
        data: {
          conversationId,
          content: reply,
          role: 'assistant',
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastActivity: new Date() },
      });
      this.eventsService.emit('message', conversationId);
      try {
        await this.metaService.sendTextMessage(conversation.phoneNumber, reply);
      } catch (error) {
        this.logger.error(
          `No se pudo enviar por Meta la respuesta de IA en ${conversationId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error en IA para ${conversationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
