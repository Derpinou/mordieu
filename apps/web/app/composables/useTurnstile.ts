import type { ShallowRef } from 'vue'

// Le guet : le widget Turnstile de Cloudflare, qui délivre les jetons que /api/traduire vérifie.
// Un jeton ne sert qu'une fois : on en redemande un dès qu'on a pris le précédent, pour que le
// suivant soit prêt avant le prochain clic.

interface Turnstile {
  render(conteneur: HTMLElement, options: Record<string, unknown>): string | null | undefined
  reset(widget: string): void
  remove(widget: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/** Un échec du guet, avec un message prêt à montrer. */
export class ErreurGuet extends Error {
  override name = 'ErreurGuet'
}

let chargement: Promise<Turnstile> | undefined

function chargerTurnstile(): Promise<Turnstile> {
  chargement ??= new Promise((resoudre, rejeter) => {
    if (window.turnstile) return resoudre(window.turnstile)
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.turnstile ? resoudre(window.turnstile) : rejeter(new Error('Turnstile absent')))
    script.onerror = () => {
      chargement = undefined
      rejeter(new Error('Script Turnstile injoignable'))
    }
    document.head.append(script)
  })
  return chargement
}

export function useTurnstile(conteneur: Readonly<ShallowRef<HTMLElement | null>>) {
  const { turnstileSiteKey } = useRuntimeConfig().public
  /** Vrai quand Turnstile demande au visiteur de cocher la case. */
  const interactif = ref(false)

  let widget: string | undefined
  let jeton: string | undefined
  let attente: { resoudre: (jeton: string) => void; rejeter: (erreur: ErreurGuet) => void } | undefined
  let panne: ErreurGuet | undefined

  function echouer(erreur: ErreurGuet, definitif = false) {
    if (definitif) panne = erreur
    attente?.rejeter(erreur)
    attente = undefined
  }

  onMounted(async () => {
    if (!turnstileSiteKey) {
      return echouer(new ErreurGuet("Mordieu ! Le guet n'est point à son poste : il manque la clé Turnstile."), true)
    }
    try {
      const turnstile = await chargerTurnstile()
      if (!conteneur.value) return
      widget =
        turnstile.render(conteneur.value, {
          sitekey: turnstileSiteKey,
          action: 'traduire',
          language: 'fr',
          theme: 'light',
          size: 'flexible',
          appearance: 'interaction-only',
          // Le jeton part dans le JSON de la requête, pas dans un champ caché du formulaire.
          'response-field': false,
          callback: (nouveau: string) => {
            if (attente) {
              attente.resoudre(nouveau)
              attente = undefined
              renouveler()
            } else {
              jeton = nouveau
            }
          },
          'expired-callback': () => {
            jeton = undefined
          },
          'before-interactive-callback': () => {
            interactif.value = true
          },
          'after-interactive-callback': () => {
            interactif.value = false
          },
          'error-callback': () => {
            echouer(new ErreurGuet("Diantre ! Le guet n'a pu te reconnaître. Réessaie dans un instant."))
          },
          'timeout-callback': () => {
            echouer(new ErreurGuet('Le guet a attendu en vain que tu coches la case. Réessaie.'))
          },
          'unsupported-callback': () => {
            echouer(new ErreurGuet('Las ! Ton navigateur est trop ancien pour le guet de ce site.'), true)
          },
        }) ?? undefined
      if (!widget) throw new Error('Turnstile ne s’est pas affiché')
    } catch (erreur) {
      console.error(erreur)
      echouer(
        new ErreurGuet("Morbleu ! Le guet ne répond point : un bloqueur l'empêche peut-être de se montrer."),
        true,
      )
    }
  })

  onBeforeUnmount(() => {
    if (widget) window.turnstile?.remove(widget)
  })

  function renouveler() {
    if (widget) window.turnstile?.reset(widget)
  }

  /** Un jeton neuf pour la prochaine demande ; attend le widget s'il n'en a pas encore. */
  function prendreJeton(): Promise<string> {
    if (panne) return Promise.reject(panne)
    if (jeton) {
      const pris = jeton
      jeton = undefined
      renouveler()
      return Promise.resolve(pris)
    }
    attente?.rejeter(new ErreurGuet('Demande remplacée'))
    return new Promise((resoudre, rejeter) => {
      attente = { resoudre, rejeter }
    })
  }

  return { prendreJeton, interactif }
}
