// Aperçu des liens du site sur Discord, en composants (Components V2) plutôt qu'en embed classique :
// https://docs.discord.com/developers/link-previews/component-embeds
// Discord n'exécute pas de JavaScript : la page prérendue le porte dans un <script> de son <head>.
// Au-delà de 3 000 octets, ou avec une clé que Discord n'accepte pas, il n'affiche rien :
// test/embedDiscord.test.ts y veille. L'Embed Debugger de Discord le vérifie en vrai.

const LIEN_BOT = 'https://discord.com/oauth2/authorize?client_id=1553081604652662794'
const LIEN_SOURCE = 'https://github.com/Derpinou/mordieu'

// Types des composants Discord.
const RANGEE = 1
const BOUTON = 2
const TEXTE = 10
const SEPARATEUR = 14
const CONTENEUR = 17
// Seul style de bouton permis dans un aperçu de lien.
const STYLE_LIEN = 5

export const embedDiscord = {
  component: {
    type: CONTENEUR,
    // --rubrique, le rouge du titre et du sceau.
    accent_color: 0x8f1d14,
    components: [
      {
        type: TEXTE,
        content:
          '# Mordieu\nTraduis ton français de tous les jours en faux vieux françois, avecques jurons et tournures d’antan.',
      },
      {
        type: TEXTE,
        content: '> Mon frère, on va tout casser !\n**Palsambleu mien fraternel, nous allons tout mettre à sac !**',
      },
      { type: SEPARATEUR },
      {
        type: RANGEE,
        components: [
          { type: BOUTON, style: STYLE_LIEN, label: 'Ajouter le bot', url: LIEN_BOT },
          { type: BOUTON, style: STYLE_LIEN, label: 'Code source', url: LIEN_SOURCE },
        ],
      },
    ],
  },
}
