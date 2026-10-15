import { type BindingAI, LONGUEUR_MAX, modeleWorkersAI, traduire } from '@mordieu/core'
import {
  type APIApplicationCommandInteraction,
  type APIInteraction,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v10'
import { formaterTraduction, modifierReponse } from './discord.ts'
import { signatureValide } from './signature.ts'

export interface Env {
  AI: BindingAI
  DISCORD_PUBLIC_KEY: string
}

/** La partie du contexte d'exécution des Workers dont le bot se sert. */
interface Contexte {
  waitUntil(promesse: Promise<unknown>): void
}

// ctx.waitUntil() s'arrête 30 s après la réponse : on abandonne avant, pour avoir le temps de prévenir.
const DELAI_MAX = 25_000

export default {
  async fetch(requete: Request, env: Env, ctx: Contexte): Promise<Response> {
    if (requete.method !== 'POST') {
      return new Response("Mordieu ! Ici, on ne répond qu'aux interactions Discord.", { status: 405 })
    }
    const corps = await requete.text()
    const signee = await signatureValide(
      corps,
      requete.headers.get('x-signature-ed25519'),
      requete.headers.get('x-signature-timestamp'),
      env.DISCORD_PUBLIC_KEY,
    )
    if (!signee) return new Response('Signature invalide', { status: 401 })
    return Response.json(repondre(JSON.parse(corps) as APIInteraction, env, ctx))
  },
}

function repondre(interaction: APIInteraction, env: Env, ctx: Contexte): APIInteractionResponse {
  if (interaction.type === InteractionType.Ping) return { type: InteractionResponseType.Pong }
  if (interaction.type !== InteractionType.ApplicationCommand) {
    return messageDiscret('Diantre ! Je ne sçay que faire de cela.')
  }

  const { texte, discret } = lireDemande(interaction)
  const aTraduire = texte.trim()
  if (!aTraduire) return messageDiscret('Diantre ! Ce message ne contient point de texte à traduire.')
  if (aTraduire.length > LONGUEUR_MAX) {
    return messageDiscret(`Palsambleu ! C'est trop long pour mon parchemin : ${LONGUEUR_MAX} caractères au plus.`)
  }

  // Discord exige une réponse en 3 s : on accuse réception tout de suite (il affiche « réfléchit… »),
  // et la traduction remplacera ce message.
  ctx.waitUntil(traduireEtPublier(interaction, aTraduire, env))
  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: discret ? { flags: MessageFlags.Ephemeral } : undefined,
  }
}

/** Le texte à traduire et la visibilité de la réponse, selon la commande utilisée. */
function lireDemande(interaction: APIApplicationCommandInteraction): { texte: string; discret: boolean } {
  const { data } = interaction
  if (data.type === ApplicationCommandType.Message) {
    return { texte: data.resolved.messages[data.target_id]?.content ?? '', discret: false }
  }
  if (data.type !== ApplicationCommandType.ChatInput) return { texte: '', discret: true }
  const texte = data.options?.find((option) => option.name === 'texte')
  const discret = data.options?.find((option) => option.name === 'discret')
  return {
    texte: texte?.type === ApplicationCommandOptionType.String ? texte.value : '',
    discret: discret?.type === ApplicationCommandOptionType.Boolean && discret.value,
  }
}

async function traduireEtPublier({ application_id, token }: APIInteraction, texte: string, env: Env): Promise<void> {
  let contenu: string
  try {
    // Le message ne montre que la traduction principale : inutile de faire écrire des variantes au modèle.
    const traduction = await traduire(modeleWorkersAI(env.AI), texte, {
      variantes: false,
      abortSignal: AbortSignal.timeout(DELAI_MAX),
    })
    contenu = formaterTraduction(traduction)
  } catch (erreur) {
    console.error('Échec de la traduction', erreur)
    contenu = 'Diantre ! Le scribe a renversé son encrier… Réessaie dans un instant.'
  }
  await modifierReponse(application_id, token, contenu)
}

function messageDiscret(contenu: string): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content: contenu, flags: MessageFlags.Ephemeral },
  }
}
