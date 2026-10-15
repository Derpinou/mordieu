import { createApp, toWebHandler } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import route, { type Env } from '../server/api/traduire.post.ts'
import { fausseIA, fauxLimiteur } from './aides.ts'

// La route branchée sur une app h3 nue : Nitro lui fournit les bindings de la même façon, dans event.context.
const repondre = toWebHandler(createApp().use('/api/traduire', route))

const reponseIA = JSON.stringify({ traduction: 'Mille grasces', variantes: ['Grand mercy, messire'] })
const SECRET = 'secret-turnstile'
const IP = '203.0.113.7'

/** Envoie la demande comme la page, avec ces bindings (de faux bindings qui laissent tout passer, par défaut). */
async function envoyer(corps: unknown, bindings: Partial<Env> = {}) {
  const env = { AI: fausseIA(reponseIA), LIMITEUR: fauxLimiteur(), TURNSTILE_SECRET_KEY: SECRET, ...bindings }
  const requete = new Request('https://mordieu.test/api/traduire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': IP },
    body: typeof corps === 'string' ? corps : JSON.stringify(corps),
  })
  const reponse = await repondre(requete, { cloudflare: { env } })
  return { statut: reponse.status, json: await reponse.json(), env }
}

const demande = { texte: 'Merci beaucoup', jeton: 'jeton-du-widget' }

let verifications: unknown[]
let turnstileValide: boolean

beforeEach(() => {
  verifications = []
  turnstileValide = true
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      if (url !== 'https://challenges.cloudflare.com/turnstile/v0/siteverify') throw new Error(`Appel inattendu : ${url}`)
      verifications.push(JSON.parse(init.body as string))
      return Response.json({ success: turnstileValide })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/traduire', () => {
  it('renvoie la traduction et les variantes', async () => {
    const { statut, json, env } = await envoyer(demande)
    expect(statut).toBe(200)
    expect(json).toEqual({ traduction: 'Mille grasces', variantes: ['Grand mercy, messire'] })
    expect(env.AI.run).toHaveBeenCalledOnce()
  })

  it('vérifie le jeton auprès de Turnstile et compte les demandes par adresse IP', async () => {
    const { env } = await envoyer(demande)
    expect(verifications).toEqual([{ secret: SECRET, response: 'jeton-du-widget', remoteip: IP }])
    expect(env.LIMITEUR.limit).toHaveBeenCalledWith({ key: IP })
  })

  it('jeton refusé par Turnstile : 403, sans appeler l’IA', async () => {
    turnstileValide = false
    const { statut, json, env } = await envoyer(demande)
    expect(statut).toBe(403)
    expect(json).toEqual({ erreur: expect.stringContaining('Le guet') })
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it('jeton vide : 403, sans même interroger Turnstile', async () => {
    const { statut } = await envoyer({ ...demande, jeton: '' })
    expect(statut).toBe(403)
    expect(verifications).toEqual([])
  })

  it('trop de demandes : 429, avant de vérifier le jeton', async () => {
    const { statut, json, env } = await envoyer(demande, { LIMITEUR: fauxLimiteur(false) })
    expect(statut).toBe(429)
    expect(json).toEqual({ erreur: expect.stringContaining('Le scribe a la main lasse') })
    expect(verifications).toEqual([])
    expect(env.AI.run).not.toHaveBeenCalled()
  })

  it('texte vide ou trop long : 400, sans appeler l’IA', async () => {
    for (const texte of ['   ', 'a'.repeat(501)]) {
      const { statut, json, env } = await envoyer({ ...demande, texte })
      expect(statut).toBe(400)
      expect(json).toEqual({ erreur: expect.stringMatching(/^Palsambleu ! /) })
      expect(env.AI.run).not.toHaveBeenCalled()
    }
  })

  it('demande illisible : 400', async () => {
    for (const corps of ['pas du JSON', { texte: 42, jeton: 'x' }, { texte: 'Bonjour' }]) {
      const { statut, json } = await envoyer(corps)
      expect(statut).toBe(400)
      expect(json).toEqual({ erreur: expect.any(String) })
    }
    expect(verifications).toEqual([])
  })

  it('si l’IA échoue : 502, avec un message dans le ton', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { statut, json } = await envoyer(demande, { AI: fausseIA(new Error('Workers AI indisponible')) })
    expect(statut).toBe(502)
    expect(json).toEqual({ erreur: expect.stringContaining('Le scribe a renversé son encrier') })
  })

  it('sans secret Turnstile : 500, sans appeler l’IA', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { statut, env } = await envoyer(demande, { TURNSTILE_SECRET_KEY: undefined })
    expect(statut).toBe(500)
    expect(env.AI.run).not.toHaveBeenCalled()
  })
})
