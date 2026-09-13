import { PrismaService } from '../../prisma/prisma.service';

export interface ConversationTurn {
  role: string;
  content: string;
}

export interface BuildHistoryOptions {
  prisma: PrismaService;
  conversationId: string;
}

export const buildHistoryUseCase = async ({
  prisma,
  conversationId,
}: BuildHistoryOptions): Promise<ConversationTurn[]> => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: -20,
  });

  return messages.map((message) => ({
    role:
      message.role === 'user' || message.role === 'human'
        ? ('user' as const)
        : ('assistant' as const),
    content: message.content,
  }));
};
