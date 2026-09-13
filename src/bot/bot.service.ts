import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetaService } from '../meta/meta.service';
import { EventsService } from '../events/events.service';
import { runBotFlowUseCase, BotState } from './use-cases/run-bot-flow.use-case';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Ejecuta el bot de reglas en modo BOT si el mensaje matchea el menú.
   * Devuelve true si el bot respondió (hubo match).
   */
  async tryHandle(conversationId: string): Promise<boolean> {
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

    const state = (conversation.botState ?? null) as BotState;
    this.logger.log(
      `[debug-bot] conv=${conversationId} mode=${conversation.mode} state=${String(state)} last=${lastMessage.content.slice(0, 60)}`,
    );
    const result = runBotFlowUseCase(state, lastMessage.content);
    this.logger.log(
      `[debug-bot] result=${result ? `reply(${result.reply.length}) next=${String(result.nextState)} done=${Boolean(result.done)}` : 'NULL'}`,
    );
    if (!result) {
      return false;
    }

    try {
      await this.prisma.message.create({
        data: {
          conversationId,
          content: result.reply,
          role: 'assistant',
        },
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          botState: result.nextState ?? null,
          lastActivity: new Date(),
          // Si el cliente pide asesor humano, la conversación pasa a modo
          // humano para que el operador entre a chatear.
          ...(result.nextState === 'contacto' && conversation.mode !== 'HUMANO'
            ? { mode: 'HUMANO' }
            : {}),
        },
      });
      // Notifica al frontend apenas se guarda la respuesta; si el envío por
      // Meta falla (número de prueba, ventana cerrada) igual se ve en el chat.
      this.eventsService.emit('message', conversationId);
      try {
        await this.metaService.sendTextMessage(
          conversation.phoneNumber,
          result.reply,
        );
      } catch (error) {
        this.logger.error(
          `No se pudo enviar por Meta la respuesta del bot en ${conversationId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error en bot para ${conversationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }
}
