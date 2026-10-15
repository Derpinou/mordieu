const VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Demande à Cloudflare si le jeton du widget est valide. Un jeton ne passe qu'une fois. */
export async function jetonValide(jeton: string, secret: string, ip?: string): Promise<boolean> {
  // Un jeton fait au plus 2048 caractères : inutile de déranger Cloudflare pour le reste.
  if (!jeton || jeton.length > 2048) return false
  try {
    const reponse = await fetch(VERIFICATION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: jeton, remoteip: ip }),
    })
    if (!reponse.ok) throw new Error(`Turnstile a répondu ${reponse.status}`)
    const { success } = (await reponse.json()) as { success?: boolean }
    return success === true
  } catch (erreur) {
    console.error('Vérification Turnstile impossible', erreur)
    return false
  }
}
