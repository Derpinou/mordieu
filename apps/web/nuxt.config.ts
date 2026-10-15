import { LONGUEUR_MAX } from '@mordieu/core'

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
    // Clé de site Turnstile, publique : NUXT_PUBLIC_TURNSTILE_SITE_KEY, lue au build (variable de
    // build de Workers Builds) et inscrite dans la page prérendue. Le script `dev` fournit celle de test.
    public: { turnstileSiteKey: '' },
  },

  // Les pages sont servies telles quelles par les fichiers statiques du Worker : seul /api/traduire l'exécute.
  routeRules: {
    '/': { prerender: true },
    '/mentions-legales': { prerender: true },
    '/confidentialite': { prerender: true },
  },

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
