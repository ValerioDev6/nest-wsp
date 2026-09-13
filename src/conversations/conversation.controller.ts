import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateModeDto } from './dto/update-mode.dto';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  @ApiOperation({ summary: 'Lista conversaciones con su último mensaje' })
  @ApiResponse({ status: 200, description: 'Lista de conversaciones' })
  findAll() {
    return this.conversationService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crea una conversación con un número WhatsApp' })
  @ApiResponse({ status: 201, description: 'Conversación creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() dto: CreateConversationDto) {
    return this.conversationService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina una conversación y sus mensajes' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Conversación eliminada' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Obtiene el historial de mensajes' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiQuery({
    name: 'after',
    required: false,
    description:
      'ID del último mensaje ya pintado: devuelve solo los posteriores',
  })
  @ApiResponse({ status: 200, description: 'Mensajes de la conversación' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  getMessages(@Param('id') id: string, @Query('after') after?: string) {
    return this.conversationService.getMessages(id, after);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Envía un mensaje del operador (modo HUMANO)' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiResponse({
    status: 201,
    description: 'Mensaje guardado y entregado a WhatsApp',
  })
  @ApiResponse({
    status: 400,
    description:
      'Meta rechazó el envío (p. ej. ventana de 24h cerrada). La respuesta incluye savedMessage, metaCode y windowClosed',
  })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  createMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.conversationService.createMessage(id, dto);
  }

  @Post(':id/mode')
  @ApiOperation({ summary: 'Cambia el modo de gestión (AI | HUMAN)' })
  @ApiParam({ name: 'id', description: 'ID de la conversación' })
  @ApiResponse({ status: 201, description: 'Conversación con el nuevo modo' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  updateMode(@Param('id') id: string, @Body() dto: UpdateModeDto) {
    return this.conversationService.updateMode(id, dto);
  }
}
