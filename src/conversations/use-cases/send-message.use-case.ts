import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';

export interface SendMessageOptions {
  prisma: PrismaService;
  conversationId: string;
  dto: CreateMessageDto;
  sendTextMessage: (to: string, text: string) => Promise<unknown>;
  processIncomingMessage?: (conversationId: string) => Promise<boolean>;
  emitMessageEvent?: (conversationId: string) => void;
}

export const sendMessageUseCase = async ({
  prisma,
  conversationId,
  dto,
  sendTextMessage,
  processIncomingMessage,
  emitMessageEvent,
}: SendMessageOptions) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundException(`Conversación ${conversationId} no encontrada`);
  }

  // En modo BOT/IA el composer del front actúa como el cliente: el mensaje
  // entra como "user" y el bot (o la IA) responde automáticamente.
  if (conversation.mode === 'BOT' || conversation.mode === 'IA') {
    const saved = await prisma.message.create({
      data: {
        conversationId,
        content: dto.content,
        role: 'user',
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivity: new Date() },
    });

    emitMessageEvent?.(conversationId);

    let botReplied = false;
    if (processIncomingMessage) {
      botReplied = await processIncomingMessage(conversationId);
    }

    return { ...saved, botReplied };
  }

  const saved = await prisma.message.create({
    data: {
      conversationId,
      content: dto.content,
      role: 'human',
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastActivity: new Date() },
  });

  try {
    const response = await sendTextMessage(
      conversation.phoneNumber,
      dto.content,
    );
    const waMessageId = (response as { messages?: { id?: string }[] })
      ?.messages?.[0]?.id;

    const updated = waMessageId
      ? await prisma.message.update({
          where: { id: saved.id },
          data: { waMessageId },
        })
      : saved;

    return { ...updated, delivery: response };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al enviar';
    const metaCode = (error as { metaCode?: number })?.metaCode;
    throw new BadRequestException({
      message,
      notSent: true,
      savedMessage: saved.id,
      metaCode: metaCode ?? null,
      windowClosed: metaCode === 131047,
    });
  }
};
