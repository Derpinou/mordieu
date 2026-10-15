/**
 * Vérifie qu'une requête vient bien de Discord : la signature Ed25519 porte sur l'horodatage
 * suivi du corps brut. Discord envoie exprès de fausses signatures et retire l'URL du bot
 * s'il les accepte.
 */
export async function signatureValide(
  corps: string,
  signature: string | null,
  horodatage: string | null,
  clePublique: string,
): Promise<boolean> {
  if (!signature || !horodatage) return false
  try {
    const cle = await crypto.subtle.importKey('raw', hexEnOctets(clePublique), { name: 'Ed25519' }, false, ['verify'])
    return await crypto.subtle.verify('Ed25519', cle, hexEnOctets(signature), new TextEncoder().encode(horodatage + corps))
  } catch {
    return false
  }
}

function hexEnOctets(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(hex.match(/../g)?.map((paire) => Number.parseInt(paire, 16)) ?? [])
}
