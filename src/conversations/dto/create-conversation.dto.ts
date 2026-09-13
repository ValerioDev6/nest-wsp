import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import type { ConversationMode } from './update-mode.dto';
import { CONVERSATION_MODES } from './update-mode.dto';

export class CreateConversationDto {
  @ApiProperty({
    description:
      'Número de WhatsApp del cliente en formato internacional sin "+"',
    example: '51944431024',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{8,15}$/, {
    message: 'phoneNumber debe ser solo dígitos, sin espacios ni símbolos',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Nombre del contacto (opcional)',
    example: 'Elis',
  })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Modo de gestión inicial de la conversación',
    enum: CONVERSATION_MODES,
    default: 'BOT',
  })
  @IsIn(CONVERSATION_MODES)
  @IsOptional()
  mode?: ConversationMode;
}
