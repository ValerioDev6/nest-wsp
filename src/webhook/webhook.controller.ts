import type { RawBodyRequest } from '@nestjs/common';
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { appendFileSync, mkdirSync } from 'node:fs';
import { WebhookService } from './webhook.service';

const log = (line: string) => {
  try {
    mkdirSync('/tmp/opencode', { recursive: true });
    appendFileSync(
      '/tmp/opencode/webhook.log',
      `${new Date().toISOString()} ${line}\n`,
    );
  } catch {
    void 0;
  }
};

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  @ApiOperation({
    summary: 'Verificación del webhook por Meta',
    description:
      'Meta consulta este endpoint al configurar el webhook. Devuelve el hub.challenge como texto plano si el token es válido.',
  })
  @ApiQuery({
    name: 'hub.mode',
    description: 'Siempre "subscribe" en la verificación de Meta',
    example: 'subscribe',
    required: false,
  })
  @ApiQuery({
    name: 'hub.verify_token',
    description: 'Token definido en META_VERIFY_TOKEN',
    required: false,
  })
  @ApiQuery({
    name: 'hub.challenge',
    description: 'Valor que Meta espera recibir de vuelta',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Challenge devuelto como texto' })
  @ApiResponse({ status: 401, description: 'Verify token inválido' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ) {
    log(
      `GET mode=${mode ?? '-'} verify=${
        verifyToken === process.env.META_VERIFY_TOKEN ? 'OK' : 'BAD'
      } challenge=${(challenge ?? '').slice(0, 24)}`,
    );
    return this.webhookService.verify({ mode, verifyToken, challenge });
  }

  @Post()
  @ApiOperation({
    summary: 'Recibe eventos de WhatsApp (mensajes entrantes)',
    description:
      'Valida la firma X-Hub-Signature-256, deduplica por message.id y procesa según el modo (AI/HUMAN). Responde de inmediato.',
  })
  @ApiResponse({ status: 201, description: 'Evento recibido y en proceso' })
  @ApiResponse({ status: 400, description: 'Body ausente o firma inválida' })
  async handleEvent(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      log(
        `POST sin body (rawBody vacío), sig16=${signature?.slice(0, 16) ?? '-'}`,
      );
      throw new BadRequestException('Body requerido');
    }

    try {
      this.webhookService.processEvent(rawBody, signature);
      log(
        `POST OK sig16=${signature?.slice(0, 16) ?? '-'} bytes=${rawBody.byteLength} body=${rawBody
          .toString('utf8')
          .slice(0, 240)
          .replace(/\s+/g, ' ')}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(
        `POST FAIL sig16=${signature?.slice(0, 16) ?? '-'} err=${msg} body=${rawBody
          .toString('utf8')
          .slice(0, 240)
          .replace(/\s+/g, ' ')}`,
      );
      throw error;
    }
    return { received: true };
  }
}
