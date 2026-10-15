import { LONGUEUR_MAX } from '@mordieu/core'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  InteractionContextType,
  type RESTPutAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'

// Installable sur un serveur comme par un utilisateur, et utilisable partout, MP compris.
const partout = {
  integration_types: [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall],
  contexts: [InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel],
}

/** Les commandes du bot, envoyées à Discord par scripts/enregistrer-commandes.ts. */
export const COMMANDES: RESTPutAPIApplicationCommandsJSONBody = [
  {
    ...partout,
    type: ApplicationCommandType.ChatInput,
    name: 'mordieu',
    description: 'Traduis ton texte en vieux françois',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'texte',
        description: 'Le texte à traduire',
        required: true,
        max_length: LONGUEUR_MAX,
      },
      {
        type: ApplicationCommandOptionType.Boolean,
        name: 'discret',
        description: 'Toi seul verras la réponse',
      },
    ],
  },
  {
    ...partout,
    type: ApplicationCommandType.Message,
    name: 'Traduire en vieux françois',
  },
]
