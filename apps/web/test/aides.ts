// Faux bindings du Worker pour les tests de la route.
import { vi } from 'vitest'

/** Faux binding Workers AI : renvoie `contenu` au format chat completions, ou lève l'erreur donnée. */
export function fausseIA(contenu: string | Error) {
  return {
    run: vi.fn(async () => {
      if (contenu instanceof Error) throw contenu
      return {
        choices: [{ message: { content: contenu }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1200, completion_tokens: 100 },
      }
    }),
  }
}

/** Faux binding Rate Limiting : laisse passer, ou non. */
export function fauxLimiteur(laissePasser = true) {
  return { limit: vi.fn(async (_options: { key: string }) => ({ success: laissePasser })) }
}
