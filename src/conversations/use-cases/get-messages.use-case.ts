import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GetMessagesOptions {
  prisma: PrismaService;
  conversationId: string;
  /** ID del último mensaje ya pintado: si se pasa, devuelve solo los posteriores. */
  after?: string;
}

export const getMessagesUseCase = async ({
  prisma,
  conversationId,
  after,
}: GetMessagesOptions) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundException(`Conversación ${conversationId} no encontrada`);
  }

  let afterCreatedAt: Date | undefined;
  if (after) {
    const cursor = await prisma.message.findUnique({
      where: { id: after },
      select: { createdAt: true },
    });
    if (cursor) {
      afterCreatedAt = cursor.createdAt;
    }
  }

  return prisma.message.findMany({
    where: {
      conversationId,
      ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}),
    },
    orderBy: { createdAt: 'asc' },
  });
};
