import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface DeleteConversationOptions {
  prisma: PrismaService;
  id: string;
}

export const deleteConversationUseCase = async ({
  prisma,
  id,
}: DeleteConversationOptions): Promise<{ deleted: true }> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation) {
    throw new NotFoundException(`Conversación ${id} no encontrada`);
  }

  await prisma.conversation.delete({ where: { id } });
  return { deleted: true };
};
