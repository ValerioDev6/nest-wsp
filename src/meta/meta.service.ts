import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MetaConfig } from './use-cases/meta.config';
import { getConnectionStatusUseCase } from './use-cases/get-connection-status.use-case';
import { sendTextMessageUseCase } from './use-cases/send-text-message.use-case';

@Injectable()
export class MetaService {
  private readonly config: MetaConfig = {
    accessToken: process.env.META_ACCESS_TOKEN ?? '',
    phoneNumberId: process.env.META_PHONE_NUMBER_ID ?? '',
    graphVersion: process.env.META_GRAPH_VERSION ?? 'v25.0',
    baseUrl: 'https://graph.facebook.com',
  };

  constructor(private readonly httpService: HttpService) {}

  getConnectionStatus() {
    return getConnectionStatusUseCase(this.httpService, this.config);
  }

  sendTextMessage(to: string, text: string) {
    return sendTextMessageUseCase(this.httpService, this.config, to, text);
  }
}
