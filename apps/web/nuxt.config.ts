import { LONGUEUR_MAX } from '@mordieu/core'

// Clé de site Turnstile du widget de production : publique, elle finit dans la page prérendue
// (mise en route : README). En développement, on prend la clé de test officielle de Cloudflare,
// dont le widget passe toujours sans rien demander.
const CLE_SITE_TURNSTILE = ''
const CLE_SITE_TURNSTILE_TEST = '1x00000000000000000000AA'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  modules: ['@nuxt/fonts'],
  css: ['~/assets/css/parchemin.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Mordieu : traducteur en vieux françois',
      meta: [
        {
          name: 'description',
          content: 'Traduis ton français de tous les jours en faux vieux françois, avecques jurons et tournures d’antan.',
        },
        { name: 'theme-color', content: '#3a2614' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  // Fixé au build : la page qui importerait le moteur embarquerait zod avec.
  appConfig: { longueurMax: LONGUEUR_MAX },

  runtimeConfig: {
    public: { turnstileSiteKey: CLE_SITE_TURNSTILE },
  },
  $development: {
    runtimeConfig: { public: { turnstileSiteKey: CLE_SITE_TURNSTILE_TEST } },
  },

  // La page est servie telle quelle par les fichiers statiques du Worker : seul /api/traduire l'exécute.
  routeRules: { '/': { prerender: true } },

  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      // Génère .output/server/wrangler.json à partir de wrangler.jsonc : `wrangler deploy` le prend
      // depuis ce dossier.
      deployConfig: true,
      // Nitro s'appuie sur des API Node (Buffer…) : nodejs_compat les fournit, sans polyfills dans le bundle.
      nodeCompat: true,
    },
  },

  fonts: {
    // Le latin de Google Fonts couvre le français, œ compris.
    defaults: { weights: [400], styles: ['normal', 'italic'], subsets: ['latin'] },
    families: [
      { name: 'Grenze Gotisch', weights: [600], styles: ['normal'] },
      { name: 'EB Garamond', weights: [400, 600], preload: { weights: [400], styles: ['normal'] } },
      { name: 'IM Fell English' },
    ],
  },

  typescript: {
    // Les tests ont leur propre tsconfig (types Node et serveur), voir test/tsconfig.json.
    tsConfig: { exclude: ['../test'] },
  },
})
