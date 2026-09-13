import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const CONVERSATION_MODES = ['BOT', 'HUMANO', 'IA'] as const;

export type ConversationMode = (typeof CONVERSATION_MODES)[number];

export class UpdateModeDto {
  @ApiProperty({
    description: 'Modo de gestión de la conversación',
    enum: CONVERSATION_MODES,
    example: 'HUMANO',
  })
  @IsIn(CONVERSATION_MODES, {
    message: 'El modo debe ser "BOT", "HUMANO" o "IA"',
  })
  mode: ConversationMode;
}
