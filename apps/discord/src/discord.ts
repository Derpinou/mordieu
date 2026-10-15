import type { Traduction } from '@mordieu/core'

const API = 'https://discord.com/api/v10'
const LIMITE_MESSAGE = 2000

/** Le message publié : la traduction principale seule, sans le texte d'origine ni les variantes. */
export function formaterTraduction({ traduction }: Pick<Traduction, 'traduction'>): string {
  return traduction.slice(0, LIMITE_MESSAGE)
}

/** Remplace le message « réfléchit… » affiché par Discord depuis la réponse différée. */
export async function modifierReponse(applicationId: string, jeton: string, contenu: string): Promise<void> {
  const reponse = await fetch(`${API}/webhooks/${applicationId}/${jeton}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // La traduction peut reprendre les mentions du texte d'origine : on ne notifie personne.
    body: JSON.stringify({ content: contenu, allowed_mentions: { parse: [] } }),
  })
  if (!reponse.ok) console.error(`Discord a refusé la modification (${reponse.status}) : ${await reponse.text()}`)
}
