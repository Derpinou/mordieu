import { generateText, type LanguageModel, type LanguageModelUsage } from 'ai'
import { z } from 'zod'
import { nettoyer, type Traductions } from './nettoyer.ts'
import { messageUtilisateur, promptSysteme } from './prompt.ts'

export const LONGUEUR_MAX = 500

// Workers AI coupe à 256 tokens par défaut : trop court pour 4 traductions d'un texte de
// 500 caractères, plus le raisonnement de certains modèles. Sans variantes, une seule traduction :
// la limite plus basse borne aussi le temps perdu si le modèle s'emballe.
const TOKENS_MAX = 1500
const TOKENS_MAX_SANS_VARIANTES = 600

// Variantes facultatives : on ne les demande pas toujours, et une réponse qui les oublie reste exploitable.
const schema = z.object({
  traduction: z.string(),
  variantes: z.array(z.string()).optional(),
})

export interface Traduction extends Traductions {
  /** Tokens consommés, pour suivre le coût. */
  usage: LanguageModelUsage
}

/** Texte refusé avant tout appel au modèle : vide ou trop long. */
export class TexteInvalide extends Error {
  override name = 'TexteInvalide'
}

export interface OptionsTraduction {
  temperature?: number
  /** Pour abandonner en route, par exemple au bout d'un délai (`AbortSignal.timeout()`). */
  abortSignal?: AbortSignal
  /**
   * `false` : ne demande que la traduction principale (`variantes` vide), pour une sortie plus
   * courte, donc moins chère et plus rapide. `true` par défaut.
   */
  variantes?: boolean
}

/**
 * Traduit `texte` en faux vieux français : une traduction principale et jusqu'à 3 variantes
 * (aucune avec `variantes: false`).
 *
 * Le JSON est demandé dans le prompt plutôt qu'imposé par schéma : sur Workers AI, le schéma
 * fait dérailler certains modèles (gpt-oss ne renvoie plus que des « ! »). On relance une fois
 * si la réponse est inexploitable.
 */
export async function traduire(
  modele: LanguageModel,
  texte: string,
  { temperature = 0.9, abortSignal, variantes = true }: OptionsTraduction = {},
): Promise<Traduction> {
  const aTraduire = texte.trim()
  if (!aTraduire) throw new TexteInvalide('Le texte à traduire est vide.')
  if (aTraduire.length > LONGUEUR_MAX) throw new TexteInvalide(`Le texte dépasse ${LONGUEUR_MAX} caractères.`)

  for (let essai = 1; ; essai++) {
    const { text, usage } = await generateText({
      model: modele,
      instructions: promptSysteme(variantes),
      prompt: messageUtilisateur(aTraduire),
      temperature,
      maxOutputTokens: variantes ? TOKENS_MAX : TOKENS_MAX_SANS_VARIANTES,
      abortSignal,
    })
    const sortie = extraireJson(text)
    // Sans variantes demandées, on écarte celles que le modèle aurait ajoutées quand même.
    if (sortie) return { ...nettoyer(variantes ? sortie : { traduction: sortie.traduction }), usage }
    if (essai === 2) throw new Error(`Le modèle n'a pas renvoyé de JSON exploitable : ${text.slice(0, 200)}`)
  }
}

/** Retrouve l'objet JSON dans la réponse, même entourée d'un bloc de code ou d'une phrase. */
function extraireJson(texte: string): z.infer<typeof schema> | undefined {
  const debut = texte.indexOf('{')
  const fin = texte.lastIndexOf('}')
  if (debut < 0 || fin <= debut) return undefined
  try {
    const resultat = schema.safeParse(JSON.parse(texte.slice(debut, fin + 1)))
    return resultat.success ? resultat.data : undefined
  } catch {
    return undefined
  }
}
