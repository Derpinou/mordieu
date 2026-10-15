<script setup lang="ts">
import type { DemandeTraduction, ReponseErreur, ReponseTraduction } from '../../shared/api.ts'

interface Resultat extends ReponseTraduction {
  /** Le texte traduit, pour en demander une autre version. */
  original: string
}

/** Un échec dont le message peut être montré tel quel. */
class ErreurScribe extends Error {}

const ENCRIER_RENVERSE = 'Diantre ! Le scribe a renversé son encrier… Réessaie dans un instant.'

// Les balises Open Graph restent : Discord s'en sert quand il ne peut pas montrer l'aperçu en composants.
useSeoMeta({
  ogType: 'website',
  ogTitle: 'Mordieu : traducteur en vieux françois',
  ogDescription: 'Traduis ton français de tous les jours en faux vieux françois, avecques jurons et tournures d’antan.',
})
useHead({ script: [{ id: 'discord:component-embed', type: 'application/json', textContent: embedDiscord }] })

const { longueurMax } = useAppConfig()
const texte = ref('')
const resultat = ref<Resultat>()
const erreur = ref('')
const enCours = ref(false)
/** Ce que les lecteurs d'écran annoncent : début et fin de la traduction. */
const annonce = ref('')
const restant = computed(() => longueurMax - texte.value.length)

const guet = useTemplateRef('guet')
const { avecJeton, interactif } = useTurnstile(guet)

function soumettre() {
  const aTraduire = texte.value.trim()
  if (!aTraduire) {
    erreur.value = 'Diantre ! Ton parchemin est vierge : écris d’abord quelque chose.'
    return
  }
  void traduire(aTraduire)
}

function autreVersion() {
  if (resultat.value) void traduire(resultat.value.original)
}

async function traduire(aTraduire: string) {
  if (enCours.value) return
  if (interactif.value) {
    // Le guet attend sa case cochée. « Autre version » est plus bas : il peut être hors de vue.
    guet.value?.scrollIntoView({ block: 'center' })
    return
  }
  enCours.value = true
  erreur.value = ''
  annonce.value = 'Le scribe trempe sa plume…'
  try {
    const reponse = await avecJeton((jeton) => demander({ texte: aTraduire, jeton }))
    resultat.value = { original: aTraduire, ...reponse }
    annonce.value = `En vieux françois : ${reponse.traduction}`
  } catch (e) {
    const prevue = e instanceof ErreurScribe || e instanceof ErreurGuet
    if (!prevue) console.error(e)
    erreur.value = prevue ? e.message : ENCRIER_RENVERSE
    annonce.value = ''
  } finally {
    enCours.value = false
  }
}

/** Appelle la route : en cas d'échec, l'erreur porte le message à montrer. */
async function demander(demande: DemandeTraduction): Promise<ReponseTraduction> {
  let reponse: Response
  try {
    reponse = await fetch('/api/traduire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demande),
    })
  } catch {
    throw new ErreurScribe('Morbleu ! Le messager s’est perdu en chemin. Vérifie ta connexion et réessaie.')
  }
  const corps = (await reponse.json().catch(() => ({}))) as Partial<ReponseTraduction & ReponseErreur>
  if (reponse.ok && corps.traduction) return { traduction: corps.traduction, variantes: corps.variantes ?? [] }
  throw new ErreurScribe(corps.erreur ?? ENCRIER_RENVERSE)
}

/** Met la variante choisie à la place de la traduction principale, et inversement. */
function choisir(index: number) {
  const actuel = resultat.value
  const variante = actuel?.variantes[index]
  if (!actuel || variante === undefined) return
  actuel.variantes[index] = actuel.traduction
  actuel.traduction = variante
  annonce.value = `En vieux françois : ${variante}`
}
</script>

<template>
  <main class="parchemin">
    <header class="entete">
      <h1 class="titre">Mordieu</h1>
      <p class="devise">Translateur de françois moderne en vieux françois</p>
    </header>

    <p class="intro lettrine">
      Oyez, oyez ! Écris ta phrase en français d’aujourd’hui : le scribe la mettra en vieux françois de taverne,
      avecques jurons et tournures d’antan.
    </p>

    <div class="filet" aria-hidden="true">❦</div>

    <form class="formulaire" @submit.prevent="soumettre">
      <label for="texte" class="etiquette">Ton texte</label>
      <textarea
        id="texte"
        v-model="texte"
        name="texte"
        rows="4"
        :maxlength="longueurMax"
        required
        autocomplete="off"
        placeholder="Mon frère, on va tout casser !"
        aria-describedby="compteur"
        @keydown.enter.ctrl.prevent="soumettre"
        @keydown.enter.meta.prevent="soumettre"
      />
      <p id="compteur" class="compteur" :class="{ presque: restant < 50 }">
        {{ restant }} {{ restant > 1 ? 'caractères restants' : 'caractère restant' }}
      </p>
      <!-- Le guet ne se montre que pendant qu'il attend sa case cochée, quoi qu'en décide Turnstile. -->
      <div v-show="interactif" ref="guet" />
      <p v-if="interactif" class="aide-guet">Le guet veut s’assurer que tu n’es point un automate : coche sa case.</p>
      <button type="submit" class="bouton bouton-sceau" :aria-disabled="enCours || interactif">
        {{ enCours ? 'Le scribe écrit…' : 'Traduire' }}
      </button>
    </form>

    <p class="sr-only" role="status">{{ annonce }}</p>
    <ScribeAuTravail v-if="enCours" />
    <p v-if="erreur" class="erreur" role="alert">{{ erreur }}</p>
    <CarteTraduction
      v-if="resultat"
      v-bind="resultat"
      :en-cours="enCours"
      @autre="autreVersion"
      @choisir="choisir"
    />
  </main>
</template>

<style scoped>
.entete {
  text-align: center;
}

.devise {
  margin: 0.4rem 0 0;
  font-size: 1.15rem;
  font-style: italic;
  color: var(--encre-douce);
}

.intro {
  margin: 1.75rem 0 0;
}

.formulaire {
  display: flex;
  flex-direction: column;
}

.etiquette {
  margin-bottom: 0.4rem;
  font-family: var(--font-titre);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--rubrique);
}

textarea {
  width: 100%;
  min-height: 7.5rem;
  padding: 0.75rem 0.9rem;
  font: inherit;
  font-size: 1.2rem;
  line-height: 1.45;
  color: var(--encre);
  background: rgb(255 251 240 / 0.7);
  border: 2px solid var(--encre-douce);
  border-radius: 0.35rem;
  box-shadow: inset 0 1px 3px rgb(90 55 20 / 0.2);
  resize: vertical;
}

textarea::placeholder {
  color: #76603f;
  opacity: 1;
}

.compteur {
  margin: 0.35rem 0 0;
  font-size: 0.95rem;
  text-align: right;
  color: var(--encre-douce);
}

.compteur.presque {
  font-weight: 600;
  color: var(--rubrique);
}

.aide-guet {
  margin: 0.5rem 0 0;
  color: var(--rubrique);
}

.bouton-sceau {
  margin-top: 1rem;
}

@media (min-width: 40rem) {
  .bouton-sceau {
    align-self: center;
    min-width: 15rem;
  }
}

.erreur {
  margin: 1.5rem 0 0;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: var(--rubrique-sombre);
  background: rgb(143 29 20 / 0.08);
  border-left: 4px solid var(--rubrique);
}
</style>
