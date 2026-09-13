import { PrismaService } from '../../prisma/prisma.service';
import { ConversationMode } from '../dto/update-mode.dto';

export interface CreateConversationOptions {
  prisma: PrismaService;
  dto: {
    phoneNumber: string;
    contactName?: string;
    mode?: ConversationMode;
  };
}

export const createConversationUseCase = async ({
  prisma,
  dto,
}: CreateConversationOptions) => {
  const existing = await prisma.conversation.findFirst({
    where: { phoneNumber: dto.phoneNumber },
  });

  if (existing) {
    return prisma.conversation.update({
      where: { id: existing.id },
      data: {
        contactName: dto.contactName ?? existing.contactName,
        mode: dto.mode ?? existing.mode,
      },
    });
  }

  return prisma.conversation.create({
    data: {
      phoneNumber: dto.phoneNumber,
      contactName: dto.contactName ?? null,
      mode: dto.mode ?? 'BOT',
    },
  });
};
