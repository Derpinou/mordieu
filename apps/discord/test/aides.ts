// Outils communs aux tests : clés Ed25519 comme celles de Discord, requêtes signées, faux binding IA.
import type { webcrypto } from 'node:crypto'
import { vi } from 'vitest'

const enHex = (octets: ArrayBuffer) => Buffer.from(octets).toString('hex')

async function paireDeCles(): Promise<webcrypto.CryptoKeyPair> {
  return (await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify'])) as webcrypto.CryptoKeyPair
}

const cles = await paireDeCles()
export const autresCles = await paireDeCles()
export const clePublique = enHex((await crypto.subtle.exportKey('raw', cles.publicKey)) as ArrayBuffer)

export async function signer(contenu: string, cle = cles.privateKey): Promise<string> {
  return enHex(await crypto.subtle.sign('Ed25519', cle, new TextEncoder().encode(contenu)))
}

/** Une requête comme Discord en envoie, signée avec notre clé (ou une autre). */
export async function requeteSignee(interaction: unknown, cle = cles.privateKey): Promise<Request> {
  const corps = JSON.stringify(interaction)
  const horodatage = String(Math.floor(Date.now() / 1000))
  return new Request('https://bot.test/', {
    method: 'POST',
    body: corps,
    headers: { 'x-signature-ed25519': await signer(horodatage + corps, cle), 'x-signature-timestamp': horodatage },
  })
}

/** Ce que workers-ai-provider envoie au binding, pour les vérifications des tests. */
interface EntreesIA {
  messages: { role: string; content: string }[]
  max_tokens?: number
}

/** Faux binding Workers AI : renvoie `contenu` au format chat completions, ou lève l'erreur donnée. */
export function fausseIA(contenu: string | Error) {
  return {
    run: vi.fn(async (_modele: string, _entrees: EntreesIA) => {
      if (contenu instanceof Error) throw contenu
      return {
        choices: [{ message: { content: contenu }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1200, completion_tokens: 100 },
      }
    }),
  }
}

/** Faux contexte d'exécution : garde les tâches confiées à waitUntil() pour pouvoir les attendre. */
export function fauxContexte() {
  const taches: Promise<unknown>[] = []
  return { waitUntil: (tache: Promise<unknown>) => void taches.push(tache), taches }
}
