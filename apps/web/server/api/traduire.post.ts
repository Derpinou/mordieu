// Imports explicites plutôt qu'auto-imports de Nitro : les tests appellent cette route hors de Nuxt.
import { type BindingAI, modeleWorkersAI, TexteInvalide, traduire } from '@mordieu/core'
import { defineEventHandler, getRequestHeader, getRequestIP, type H3Event, readBody, setResponseStatus } from 'h3'
import type { DemandeTraduction, ReponseErreur, ReponseTraduction } from '../../shared/api.ts'
import { CLE_SECRETE_TEST, jetonValide } from '../utils/turnstile.ts'

/** Le binding Rate Limiting de Workers. */
interface Limiteur {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

/** Bindings (wrangler.jsonc) et secret du Worker. */
export interface Env {
  AI: BindingAI
  LIMITEUR: Limiteur
  /** Absent en développement : la clé de test de Cloudflare le remplace. */
  TURNSTILE_SECRET_KEY?: string
}

// Une traduction prend 2 à 3 s : au-delà de ce délai, mieux vaut prévenir que laisser la page attendre.
const DELAI_MAX = 20_000

export default defineEventHandler(async (event): Promise<ReponseTraduction | ReponseErreur> => {
  const env = envDuWorker(event)
  const demande = lireDemande(await readBody(event).catch(() => undefined))
  if (!demande) return refuser(event, 400, 'Diantre ! Je ne sçay que faire de cela.')

  // Du moins cher au plus cher : le compteur par adresse IP, le jeton Turnstile (un appel à Cloudflare), puis l'IA.
  const ip = getRequestHeader(event, 'cf-connecting-ip') ?? getRequestIP(event)
  const { success } = await env.LIMITEUR.limit({ key: ip ?? 'inconnue' })
  if (!success) {
    return refuser(event, 429, 'Holà, tout doux ! Le scribe a la main lasse : laisse-le souffler une minute.')
  }

  const secret = env.TURNSTILE_SECRET_KEY ?? (import.meta.dev ? CLE_SECRETE_TEST : undefined)
  if (!secret) {
    console.error('Secret TURNSTILE_SECRET_KEY absent : voir apps/web/README.md')
    return refuser(event, 500, "Mordieu ! Le guet n'est point à son poste. Reviens plus tard.")
  }
  if (!(await jetonValide(demande.jeton, secret, ip))) {
    return refuser(
      event,
      403,
      "Halte-là ! Le guet n'a pu s'assurer que tu n'es point un automate. Recharge la page et réessaie.",
    )
  }

  try {
    const { traduction, variantes } = await traduire(modeleWorkersAI(env.AI), demande.texte, {
      // En dev, les bindings passent par le proxy de wrangler, qui ne sait pas transmettre un AbortSignal.
      abortSignal: import.meta.dev ? undefined : AbortSignal.timeout(DELAI_MAX),
    })
    return { traduction, variantes }
  } catch (erreur) {
    // Texte vide ou trop long : c'est le moteur qui en décide.
    if (erreur instanceof TexteInvalide) return refuser(event, 400, `Palsambleu ! ${erreur.message}`)
    console.error('Échec de la traduction', erreur)
    return refuser(event, 502, 'Diantre ! Le scribe a renversé son encrier… Réessaie dans un instant.')
  }
})

/** Les bindings, que Nitro pose sur l'événement sur Workers comme dans `nuxt dev` (via wrangler). */
function envDuWorker(event: H3Event): Env {
  const env: Env | undefined = event.context.cloudflare?.env
  if (!env) throw new Error('Bindings Cloudflare introuvables : le site tourne sur Workers ou dans `nuxt dev`.')
  return env
}

function lireDemande(corps: unknown): DemandeTraduction | undefined {
  if (typeof corps !== 'object' || corps === null) return undefined
  const { texte, jeton } = corps as Partial<Record<keyof DemandeTraduction, unknown>>
  return typeof texte === 'string' && typeof jeton === 'string' ? { texte, jeton } : undefined
}

function refuser(event: H3Event, statut: number, erreur: string): ReponseErreur {
  setResponseStatus(event, statut)
  return { erreur }
}
