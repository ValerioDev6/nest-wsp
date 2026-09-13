import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export type AppEventType = 'message' | 'conversation';

export interface AppEvent {
  type: AppEventType;
  conversationId: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly events = new Subject<AppEvent>();

  stream() {
    return this.events.asObservable();
  }

  emit(type: AppEventType, conversationId: string): void {
    this.events.next({ type, conversationId });
  }
}
