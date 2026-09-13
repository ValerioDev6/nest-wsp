import { Injectable } from '@nestjs/common';
import { ReplyService } from '../ai/reply.service';
import { EventsService } from '../events/events.service';
import { MetaService } from '../meta/meta.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateModeDto } from './dto/update-mode.dto';
import { createConversationUseCase } from './use-cases/create-conversation.use-case';
import { deleteConversationUseCase } from './use-cases/delete-conversation.use-case';
import { getMessagesUseCase } from './use-cases/get-messages.use-case';
import { listConversationsUseCase } from './use-cases/list-conversations.use-case';
import { sendMessageUseCase } from './use-cases/send-message.use-case';
import { updateModeUseCase } from './use-cases/update-mode.use-case';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
    private readonly eventsService: EventsService,
    private readonly replyService: ReplyService,
  ) {}

  findAll() {
    return listConversationsUseCase({ prisma: this.prisma });
  }

  create(dto: CreateConversationDto) {
    return createConversationUseCase({
      prisma: this.prisma,
      dto,
    }).then((conversation) => {
      this.eventsService.emit('conversation', conversation.id);
      return conversation;
    });
  }

  remove(id: string) {
    return deleteConversationUseCase({ prisma: this.prisma, id });
  }

  getMessages(id: string, after?: string) {
    return getMessagesUseCase({
      prisma: this.prisma,
      conversationId: id,
      after,
    });
  }

  createMessage(id: string, dto: CreateMessageDto) {
    return sendMessageUseCase({
      prisma: this.prisma,
      conversationId: id,
      dto,
      emitMessageEvent: (conversationId) =>
        this.eventsService.emit('message', conversationId),
      sendTextMessage: (to, text) => this.metaService.sendTextMessage(to, text),
      processIncomingMessage: (conversationId) =>
        this.replyService.processIncomingMessage(conversationId),
    }).then((result) => {
      this.eventsService.emit('message', id);
      return result;
    });
  }

  updateMode(id: string, dto: UpdateModeDto) {
    return updateModeUseCase({
      prisma: this.prisma,
      conversationId: id,
      dto,
    }).then((conversation) => {
      this.eventsService.emit('conversation', id);
      return conversation;
    });
  }
}
