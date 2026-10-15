import type { LanguageModel } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

/**
 * Réglages transmis au modèle. On coupe (ou réduit) le raisonnement : il n'aide guère
 * un travail de style et coûte du temps comme des tokens.
 */
type Reglages = {
  reasoning_effort?: 'low' | 'medium' | 'high' | null
  chat_template_kwargs?: { enable_thinking?: boolean }
}

interface Modele {
  id: `@cf/${string}`
  reglages?: Reglages
}

/** Le binding Workers AI (`env.AI`), tel que l'attend workers-ai-provider. */
export type BindingAI =NonNullable<Parameters<typeof createWorkersAI>[0]['binding']>

export type NomModele = 'mistral-small' | 'gemma-4' | 'glm-4.7-flash' | 'gpt-oss-120b' | 'llama-3.3-70b'

/** Modèles Workers AI comparés dans eval/. */
export const MODELES: Record<NomModele, Modele> = {
  'mistral-small': { id: '@cf/mistralai/mistral-small-3.1-24b-instruct' },
  'gemma-4': { id: '@cf/google/gemma-4-26b-a4b-it', reglages: { chat_template_kwargs: { enable_thinking: false } } },
  // `reasoning_effort: null` ne coupe pas son raisonnement (40 s par traduction), ceci si.
  'glm-4.7-flash': { id: '@cf/zai-org/glm-4.7-flash', reglages: { chat_template_kwargs: { enable_thinking: false } } },
  'gpt-oss-120b': { id: '@cf/openai/gpt-oss-120b', reglages: { reasoning_effort: 'low' } },
  'llama-3.3-70b': { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
}

// Choisi d'après eval/resultats/2026-10-15-1048.md : le plus fidèle et lisible, et parmi les moins chers.
export const MODELE_PAR_DEFAUT: NomModele = 'gemma-4'

/** Le modèle `nom`, branché sur le binding Workers AI (`env.AI`). */
export function modeleWorkersAI(ai: BindingAI, nom: NomModele = MODELE_PAR_DEFAUT): LanguageModel {
  const { id, reglages } = MODELES[nom]
  return createWorkersAI({ binding: ai })(id, reglages)
}
