export type BotState =
  'menu' | 'servicios' | 'precios' | 'horarios' | 'contacto' | 'idle' | null;

export interface BotFlowResult {
  reply: string;
  nextState?: BotState;
  done?: boolean;
}

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[¿?¡!.,;:'"„“”]/g, '')
    .trim();

const includes = (text: string, words: string[]): boolean =>
  words.some((word) => text.includes(word));

const EXIT_WORDS = [
  'salir',
  'adios',
  'adiós',
  'chau',
  'bye',
  'hasta luego',
  'no mas',
  'nada mas',
  'gracias',
  'terminar',
];
const MENU_WORDS = ['menu', 'menú', 'opciones', 'ayuda', 'inicio', 'lista'];
const SERVICES_WORDS = ['1', 'servicio', 'servicios'];
const PRICES_WORDS = [
  '2',
  'precio',
  'precios',
  'costo',
  'costos',
  'tarifa',
  'tarifas',
];
const HOURS_WORDS = [
  '3',
  'horario',
  'horarios',
  'hora',
  'atencion',
  'atención',
];
const CONTACT_WORDS = [
  '4',
  'contacto',
  'humano',
  'asesor',
  'persona',
  'hablar',
  'atender',
  'whatsapp',
];
const GREETINGS_WORDS = [
  'hola',
  'buenas',
  'buenos',
  'saludo',
  'hey',
  'que tal',
  'estimados',
];

const SERVICES_BLOCK =
  '1️⃣ SERVICIOS:\n\n' +
  '- Venta y reparación de equipos\n' +
  '- Soporte técnico a domicilio\n' +
  '- Consultoría IT para empresas\n\n' +
  '✏️ Escribe el número, *menú* para volver o *salir*.';

const PRICES_BLOCK =
  '2️⃣ PRECIOS:\n\n' +
  '• Diagnóstico: S/ 0 (gratis)\n' +
  '• Reparación desde: S/ 49\n' +
  '• Domicilio: S/ 59\n' +
  '• Empresa: cotización según proyecto\n\n' +
  '✏️ Escribe *menú* para volver o *salir*.';

const HOURS_BLOCK =
  '3️⃣ HORARIOS:\n\n' +
  '- Lunes a Viernes: 9:00 am – 7:00 pm\n' +
  '- Sábados: 9:00 am – 1:00 pm\n' +
  '- Domingos: cerrado\n\n' +
  '✏️ Escribe *menú* para volver o *salir*.';

export const CONTACT_BLOCK =
  '4️⃣ CONTACTO:\n\n' +
  '- WhatsApp directo: +51 944 431 024\n' +
  '- Lun a Vie 9–7, Sáb 9–1\n\n' +
  'Un asesor te atenderá en horario comercial. ✏️ *menú* o *salir*.';

const buildMenu = (): string =>
  '👋 ¡Hola! Bienvenido a *Servicios IT*.\n\n' +
  '¿En qué te puedo ayudar? Elige una opción:\n\n' +
  '1️⃣ Servicios\n' +
  '2️⃣ Precios\n' +
  '3️⃣ Horarios\n' +
  '4️⃣ Contacto / Asesor humano\n\n' +
  '✏️ Responde con el número. Escribe *salir* para terminar.';

const GOODBYE = '¡Hasta luego! 👋 Consulta nuestros servicios cuando quieras.';

const NAV_TARGETS: { words: string[]; next: BotState; block: string }[] = [
  { words: SERVICES_WORDS, next: 'servicios', block: SERVICES_BLOCK },
  { words: PRICES_WORDS, next: 'precios', block: PRICES_BLOCK },
  { words: HOURS_WORDS, next: 'horarios', block: HOURS_BLOCK },
  { words: CONTACT_WORDS, next: 'contacto', block: CONTACT_BLOCK },
];

/**
 * Detecta si el texto pide hablar con un asesor humano.
 * Se reutiliza desde ReplyService (modo IA) y desde el bot.
 */
export const isContactRequest = (input: string): boolean => {
  const text = normalize(input);
  return includes(text, CONTACT_WORDS);
};

export const runBotFlowUseCase = (
  state: BotState,
  input: string,
): BotFlowResult | null => {
  const text = normalize(input);

  // Tras "salir" la conversación queda en "idle": cualquier mensaje
  // del cliente vuelve al bucle/menú (ya no queda muerta para siempre).
  if (state === 'idle') {
    if (text.includes('salir') || includes(text, EXIT_WORDS)) {
      return { reply: GOODBYE, nextState: 'idle', done: true };
    }
    return { reply: buildMenu(), nextState: 'menu' };
  }

  if (
    text.includes('salir') ||
    (state !== null && includes(text, EXIT_WORDS))
  ) {
    return { reply: GOODBYE, nextState: 'idle', done: true };
  }

  if (!state && !includes(text, GREETINGS_WORDS)) {
    // Sin contexto de menú y sin saludo: el bot no responde.
    return null;
  }

  if (state !== 'menu' && state !== null) {
    // Dentro de un sub-estado: navegación por número/palabra, volver al menú o repetir opción
    for (const target of NAV_TARGETS) {
      if (includes(text, target.words)) {
        return { reply: target.block, nextState: target.next };
      }
    }
    if (includes(text, MENU_WORDS)) {
      return { reply: buildMenu(), nextState: 'menu' };
    }
    return { reply: buildMenu(), nextState: 'menu' };
  }

  if (state === 'menu' || !state) {
    for (const target of NAV_TARGETS) {
      if (includes(text, target.words)) {
        return { reply: target.block, nextState: target.next };
      }
    }
    if (includes(text, EXIT_WORDS)) {
      return { reply: GOODBYE, nextState: 'idle', done: true };
    }
    if (
      includes(text, MENU_WORDS) ||
      includes(text, GREETINGS_WORDS) ||
      !state
    ) {
      return { reply: buildMenu(), nextState: 'menu' };
    }
    return {
      reply:
        '🤔 No entendí esa opción. Intenta con un número del 1 al 4, escribe *menú* para ver las opciones o *salir*.',
      nextState: 'menu',
    };
  }

  if (includes(text, GREETINGS_WORDS) || !state) {
    return { reply: buildMenu(), nextState: 'menu' };
  }

  return { reply: buildMenu(), nextState: 'menu' };
};
