import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bot from '../src/index.ts'
import { autresCles, clePublique, fausseIA, fauxContexte, requeteSignee } from './aides.ts'

const reponseIA = JSON.stringify({ traduction: 'Mille grasces', variantes: ['Grand mercy, messire'] })

const commun = { application_id: 'id-app', token: 'jeton-interaction' }
const slash = (texte: string, discret?: boolean) => ({
  ...commun,
  type: InteractionType.ApplicationCommand,
  data: {
    type: ApplicationCommandType.ChatInput,
    name: 'mordieu',
    options: [
      { type: ApplicationCommandOptionType.String, name: 'texte', value: texte },
      ...(discret === undefined ? [] : [{ type: ApplicationCommandOptionType.Boolean, name: 'discret', value: discret }]),
    ],
  },
})
const menu = (contenu: string) => ({
  ...commun,
  type: InteractionType.ApplicationCommand,
  data: {
    type: ApplicationCommandType.Message,
    name: 'Traduire en vieux françois',
    target_id: 'm1',
    resolved: { messages: { m1: { content: contenu } } },
  },
})

/** Envoie l'interaction au bot, attend les tâches de fond, et renvoie la réponse et les appels à Discord. */
async function envoyer(interaction: unknown, ia = fausseIA(reponseIA)) {
  const ctx = fauxContexte()
  const reponse = await bot.fetch(await requeteSignee(interaction), { AI: ia, DISCORD_PUBLIC_KEY: clePublique }, ctx)
  await Promise.all(ctx.taches)
  return { reponse, json: await reponse.json(), ia }
}

let appelsDiscord: [string, RequestInit][]

beforeEach(() => {
  appelsDiscord = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      appelsDiscord.push([url, init])
      return new Response(null, { status: 200 })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('bot Discord', () => {
  it('répond au PING de Discord', async () => {
    const { json } = await envoyer({ type: InteractionType.Ping })
    expect(json).toEqual({ type: InteractionResponseType.Pong })
  })

  it('refuse une requête mal signée', async () => {
    const requete = await requeteSignee({ type: InteractionType.Ping }, autresCles.privateKey)
    const reponse = await bot.fetch(requete, { AI: fausseIA(reponseIA), DISCORD_PUBLIC_KEY: clePublique }, fauxContexte())
    expect(reponse.status).toBe(401)
  })

  it('/mordieu : accuse réception, puis remplace le message par la traduction', async () => {
    const { json } = await envoyer(slash('Merci beaucoup'))
    expect(json).toEqual({ type: InteractionResponseType.DeferredChannelMessageWithSource })

    expect(appelsDiscord).toHaveLength(1)
    const [url, init] = appelsDiscord[0]!
    expect(url).toBe('https://discord.com/api/v10/webhooks/id-app/jeton-interaction/messages/@original')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body as string)).toEqual({
      content: '> Merci beaucoup\n**Mille grasces**\n-# Grand mercy, messire',
      allowed_mentions: { parse: [] },
    })
  })

  it('/mordieu discret : la réponse n’est visible que de son auteur', async () => {
    const { json } = await envoyer(slash('Merci beaucoup', true))
    expect(json).toEqual({
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: { flags: MessageFlags.Ephemeral },
    })
  })

  it('menu contextuel : traduit le message visé', async () => {
    await envoyer(menu('Merci beaucoup'))
    expect(JSON.parse(appelsDiscord[0]![1].body as string).content).toContain('**Mille grasces**')
  })

  it('message sans texte ou trop long : prévient tout de suite, sans appeler l’IA', async () => {
    for (const contenu of ['', 'a'.repeat(501)]) {
      const { json, ia } = await envoyer(menu(contenu))
      expect(json).toMatchObject({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { flags: MessageFlags.Ephemeral },
      })
      expect(ia.run).not.toHaveBeenCalled()
    }
  })

  it('si l’IA échoue, le message le dit au lieu de rester bloqué sur « réfléchit… »', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await envoyer(slash('Merci beaucoup'), fausseIA(new Error('Workers AI indisponible')))
    expect(JSON.parse(appelsDiscord[0]![1].body as string).content).toContain('Le scribe a renversé son encrier')
  })
})
