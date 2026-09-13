import { Logger, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

interface WhatsAppMessage {
  from: string;
  id: string;
  text?: { body?: string };
  timestamp?: string;
  type?: string;
}

interface WhatsAppContact {
  profile?: { name?: string };
  wa_id?: string;
}

interface WhatsAppValue {
  messages?: WhatsAppMessage[];
  contacts?: WhatsAppContact[];
}

interface WhatsAppChange {
  value?: WhatsAppValue;
  field?: string;
}

export interface ProcessWebhookEventOptions {
  prisma: PrismaService;
  appSecret: string;
  processIncomingMessage: (conversationId: string) => Promise<unknown>;
  emitMessageEvent?: (conversationId: string) => void;
  emitConversationEvent?: (conversationId: string) => void;
}

export const processWebhookEventUseCase = (
  rawBody: Buffer,
  signature: string | undefined,
  {
    prisma,
    appSecret,
    processIncomingMessage,
    emitMessageEvent,
    emitConversationEvent,
  }: ProcessWebhookEventOptions,
): { received: true } => {
  const logger = new Logger('ProcessWebhookEventUseCase');

  if (!isSignatureValid(rawBody, signature, appSecret, logger)) {
    throw new UnauthorizedException('Firma del webhook inválida');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    logger.warn('Payload del webhook no es JSON válido');
    return { received: true };
  }

  void handlePayload(
    payload,
    prisma,
    processIncomingMessage,
    emitMessageEvent,
    emitConversationEvent,
    logger,
  ).catch((error) => {
    logger.error(
      'Error procesando evento del webhook',
      error instanceof Error ? error.stack : String(error),
    );
  });

  return { received: true };
};

const isSignatureValid = (
  rawBody: Buffer,
  signature: string | undefined,
  appSecret: string,
  logger: Logger,
): boolean => {
  if (!appSecret) {
    logger.warn(
      'META_APP_SECRET no configurado; saltando verificación de firma (solo desarrollo)',
    );
    return true;
  }
  if (!signature) {
    return false;
  }

  const expected = createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const provided = signature.startsWith('sha256=')
    ? signature.slice(7)
    : signature;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
};

const handlePayload = async (
  payload: unknown,
  prisma: PrismaService,
  processIncomingMessage: ProcessWebhookEventOptions['processIncomingMessage'],
  emitMessageEvent: ProcessWebhookEventOptions['emitMessageEvent'],
  emitConversationEvent: ProcessWebhookEventOptions['emitConversationEvent'],
  logger: Logger,
): Promise<void> => {
  const extracted = extractEntry(payload);
  if (!extracted) {
    return;
  }

  const { message, contactName, phoneNumber } = extracted;
  if (!message?.id) {
    return;
  }

  const waMessageId = message.id;

  const existing = await prisma.processedMessage.findUnique({
    where: { waMessageId },
  });
  if (existing) {
    logger.debug(`Mensaje ${waMessageId} ya procesado; ignorando`);
    return;
  }

  await prisma.processedMessage.create({
    data: { waMessageId },
  });

  const body = message.text?.body ?? '';
  if (!body.trim()) {
    return;
  }

  const from = phoneNumber ?? message.from;
  const isNew = !(await prisma.conversation.findFirst({
    where: { phoneNumber: from },
  }));
  const conversation = await upsertConversation(prisma, from, contactName);
  if (isNew) {
    emitConversationEvent?.(conversation.id);
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastActivity: new Date() },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: body,
      role: 'user',
      waMessageId,
    },
  });

  emitMessageEvent?.(conversation.id);

  await processIncomingMessage(conversation.id);
};

const extractEntry = (payload: unknown) => {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('entry' in payload)
  ) {
    return null;
  }

  const entries = (payload as { entry?: unknown[] }).entry;
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  const changes = (entries[0] as { changes?: unknown[] }).changes;
  const change =
    Array.isArray(changes) && changes.length > 0 ? changes[0] : null;
  const value = (change as WhatsAppChange | undefined)?.value;
  const message = value?.messages?.[0];

  if (!message) {
    return null;
  }

  const contact = value.contacts?.[0];
  return {
    message,
    contactName: contact?.profile?.name ?? null,
    phoneNumber: contact?.wa_id ?? null,
  };
};

const upsertConversation = async (
  prisma: PrismaService,
  from: string,
  contactName?: string | null,
) => {
  const existing = await prisma.conversation.findFirst({
    where: { phoneNumber: from },
  });

  if (existing) {
    if (contactName) {
      return prisma.conversation.update({
        where: { id: existing.id },
        data: { contactName },
      });
    }
    return existing;
  }

  return prisma.conversation.create({
    data: {
      phoneNumber: from,
      contactName: contactName ?? null,
      mode: 'BOT',
    },
  });
};
