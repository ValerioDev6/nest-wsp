import { PrismaService } from '../../prisma/prisma.service';

export interface ListConversationsOptions {
  prisma: PrismaService;
}

export const listConversationsUseCase = async ({
  prisma,
}: ListConversationsOptions) => {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastActivity: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    phoneNumber: conversation.phoneNumber,
    contactName: conversation.contactName,
    mode: conversation.mode,
    lastActivity: conversation.lastActivity,
    createdAt: conversation.createdAt,
    lastMessage: conversation.messages[0] ?? null,
  }));
};
