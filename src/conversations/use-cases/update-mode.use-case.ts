import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateModeDto } from '../dto/update-mode.dto';
import { CONVERSATION_MODES } from '../dto/update-mode.dto';

export interface UpdateModeOptions {
  prisma: PrismaService;
  conversationId: string;
  dto: UpdateModeDto;
}

export const updateModeUseCase = async ({
  prisma,
  conversationId,
  dto,
}: UpdateModeOptions) => {
  if (!CONVERSATION_MODES.includes(dto.mode)) {
    throw new BadRequestException('El modo debe ser "BOT", "HUMANO" o "IA"');
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new NotFoundException(`Conversación ${conversationId} no encontrada`);
  }

  return prisma.conversation.update({
    where: { id: conversationId },
    data: { mode: dto.mode },
  });
};
