import type { Traduction } from '@mordieu/core'

const API = 'https://discord.com/api/v10'
const LIMITE_MESSAGE = 2000

/** Le message publié : le texte d'origine en citation, la traduction en gras, les variantes en petit. */
export function formaterTraduction(
  original: string,
  { traduction, variantes }: Pick<Traduction, 'traduction' | 'variantes'>,
): string {
  const citation = original
    .split('\n')
    .map((ligne) => `> ${ligne}`)
    .join('\n')
  const lignes = [citation, `**${traduction}**`, ...variantes.map((variante) => `-# ${variante}`)]
  // Au-delà de la limite de Discord, on sacrifie d'abord les variantes.
  while (lignes.length > 2 && lignes.join('\n').length > LIMITE_MESSAGE) lignes.pop()
  return lignes.join('\n').slice(0, LIMITE_MESSAGE)
}

/** Remplace le message « réfléchit… » affiché par Discord depuis la réponse différée. */
export async function modifierReponse(applicationId: string, jeton: string, contenu: string): Promise<void> {
  const reponse = await fetch(`${API}/webhooks/${applicationId}/${jeton}/messages/@original`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // Le texte cité peut contenir des mentions : on ne notifie personne.
    body: JSON.stringify({ content: contenu, allowed_mentions: { parse: [] } }),
  })
  if (!reponse.ok) console.error(`Discord a refusé la modification (${reponse.status}) : ${await reponse.text()}`)
}
