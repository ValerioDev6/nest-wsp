import { HttpService } from '@nestjs/axios';
import { MetaConfig } from './meta.config';

export const describeMetaErrorUseCase = (
  code: number,
  fallback: string,
): string => {
  switch (code) {
    case 131047:
      return 'No se puede enviar el mensaje: la ventana de 24 horas del cliente cerró. Se requiere una plantilla aprobada.';
    case 131026:
      return 'El mensaje solo puede enviarse dentro de la ventana de 24 horas del cliente.';
    case 131053:
      return 'No se puede enviar este tipo de mensaje al cliente.';
    case 132000:
      return 'Error de entrega: el mensaje no pudo enviarse.';
    default:
      return fallback || `Error de Meta (${code})`;
  }
};

export const sendTextMessageUseCase = async (
  httpService: HttpService,
  config: MetaConfig,
  to: string,
  text: string,
) => {
  try {
    const response = await httpService.axiosRef.post(
      `${config.baseUrl}/${config.graphVersion}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: text },
      },
      {
        headers: { Authorization: `Bearer ${config.accessToken}` },
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as {
      response?: { data?: { error?: { code?: number; message?: string } } };
    };
    const meta = axiosError.response?.data?.error;

    if (meta && typeof meta.code === 'number') {
      const readable = describeMetaErrorUseCase(meta.code, meta.message ?? '');
      throw Object.assign(new Error(readable), { metaCode: meta.code });
    }

    throw error;
  }
};
