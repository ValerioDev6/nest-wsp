import { UnauthorizedException } from '@nestjs/common';

export interface VerifyWebhookOptions {
  expectedToken: string;
  mode: string;
  verifyToken: string;
  challenge: string;
}

export const verifyWebhookUseCase = ({
  expectedToken,
  mode,
  verifyToken,
  challenge,
}: VerifyWebhookOptions): string => {
  if (mode === 'subscribe' && verifyToken === expectedToken && challenge) {
    return challenge;
  }
  throw new UnauthorizedException('Verificación del webhook fallida');
};
