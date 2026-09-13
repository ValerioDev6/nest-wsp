import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationTurn {
  role: string;
  content: string;
}

@Injectable()
export class OpenRouterService {
  private readonly apiKey = process.env.OPENROUTER_API_KEY ?? '';
  private readonly model = process.env.OPENROUTER_MODEL ?? '';
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly systemPrompt =
    process.env.AGENT_SYSTEM_PROMPT ??
    'Eres un asistente de atención al cliente profesional. ' +
      'Responde de forma breve, clara y amable. ' +
      'Si no puedes ayudar, deriva al cliente con un agente humano.';

  constructor(private readonly httpService: HttpService) {}

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.model);
  }

  async generateReply(
    history: ConversationTurn[],
    systemPrompt?: string,
  ): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        'OpenRouter no está configurado. Revisa OPENROUTER_API_KEY y OPENROUTER_MODEL.',
      );
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt ?? this.systemPrompt },
      ...history.map((turn) => ({
        role:
          turn.role === 'assistant'
            ? ('assistant' as const)
            : ('user' as const),
        content: turn.content,
      })),
    ];

    const response = await this.httpService.axiosRef.post(
      this.apiUrl,
      {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      throw new Error('OpenRouter no devolvió una respuesta válida');
    }

    return content;
  }
}
