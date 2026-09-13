import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Contenido del mensaje a enviar al cliente',
    example: 'Hola, tu pedido está en camino',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
