import { HttpService } from '@nestjs/axios';
import { MetaConfig } from './meta.config';

export interface ConnectionStatus {
  status: 'missing_config' | 'error' | 'connected';
  detail?: string;
}

export const getConnectionStatusUseCase = async (
  httpService: HttpService,
  config: MetaConfig,
): Promise<ConnectionStatus> => {
  if (!config.accessToken || !config.phoneNumberId) {
    return {
      status: 'missing_config',
      detail: 'Faltan credenciales de Meta',
    };
  }

  try {
    await httpService.axiosRef.get(
      `${config.baseUrl}/${config.graphVersion}/${config.phoneNumberId}`,
      {
        headers: { Authorization: `Bearer ${config.accessToken}` },
        timeout: 5000,
      },
    );
    return { status: 'connected' };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error de conexión';
    return { status: 'error', detail };
  }
};
