import { Controller, Sse } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppEvent, EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE de eventos (mensajes/conversaciones)' })
  stream(): Observable<MessageEvent> {
    return this.eventsService.stream().pipe(
      map((event: AppEvent) => {
        return new MessageEvent('message', {
          data: JSON.stringify(event),
        });
      }),
    );
  }
}
