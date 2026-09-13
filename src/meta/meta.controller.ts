import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetaService } from './meta.service';

@ApiTags('connection')
@Controller('connection')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Estado de la integración con WhatsApp',
    description:
      'Devuelve "connected" cuando las credenciales son válidas y Graph API responde.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Estado: "missing_config", "error" o "connected". Incluye "detail" con más info',
  })
  getConnectionStatus() {
    return this.metaService.getConnectionStatus();
  }
}
