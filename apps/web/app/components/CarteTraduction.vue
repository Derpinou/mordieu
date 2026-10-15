<script setup lang="ts">
const props = defineProps<{
  original: string
  traduction: string
  variantes: string[]
  /** Une nouvelle version est en route. */
  enCours: boolean
}>()

const emit = defineEmits<{
  autre: []
  choisir: [index: number]
}>()

/** Retour des boutons copier et télécharger, lu aussi par les lecteurs d'écran. */
const retour = ref('')
const enluminure = ref(false)
let effacement: ReturnType<typeof setTimeout> | undefined

function signaler(message: string) {
  retour.value = message
  clearTimeout(effacement)
  effacement = setTimeout(() => (retour.value = ''), 4000)
}

async function copier() {
  try {
    await navigator.clipboard.writeText(props.traduction)
    signaler('Copié ! Colle-le où bon te semble.')
  } catch {
    signaler('Le presse-papiers refuse : sélectionne le texte à la main.')
  }
}

async function telecharger() {
  if (enluminure.value) return
  enluminure.value = true
  try {
    const image = await imageDeTraduction({
      original: props.original,
      traduction: props.traduction,
      signature: `Translaté par Mordieu · ${location.host}`,
    })
    enregistrer(image, 'mordieu.png')
    signaler('Voici ton image enluminée.')
  } catch (erreur) {
    console.error(erreur)
    signaler("Diantre ! L'enlumineur a raté son ouvrage.")
  } finally {
    enluminure.value = false
  }
}

onBeforeUnmount(() => clearTimeout(effacement))
</script>

<template>
  <article class="carte" :aria-busy="enCours" aria-labelledby="titre-carte">
    <h2 id="titre-carte" class="rubrique">En vieux françois</h2>
    <p class="traduction lettrine">{{ traduction }}</p>
    <p class="original"><span class="sr-only">Texte d’origine : </span>«&nbsp;{{ original }}&nbsp;»</p>

    <template v-if="variantes.length">
      <h3 class="rubrique rubrique-petite">Ou bien</h3>
      <ul class="variantes">
        <li v-for="(variante, index) in variantes" :key="variante">
          <button type="button" class="variante" aria-describedby="aide-variantes" @click="emit('choisir', index)">
            {{ variante }}
          </button>
        </li>
      </ul>
      <p id="aide-variantes" class="aide">Touche une variante pour la mettre en avant.</p>
    </template>

    <div class="actions">
      <button type="button" class="bouton" @click="copier">
        <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="1.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>
        Copier
      </button>
      <button type="button" class="bouton" :aria-disabled="enCours" @click="emit('autre')">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5" /></svg>
        Autre version
      </button>
      <button type="button" class="bouton" :aria-disabled="enluminure" @click="telecharger">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 4v11m-5-5 5 5 5-5M5 20h14" /></svg>
        Télécharger l’image
      </button>
    </div>
    <p class="retour" role="status">{{ retour }}</p>
  </article>
</template>

<style scoped>
.carte {
  margin-top: 1.75rem;
  padding: 1.25rem 1.1rem 0.75rem;
  background: rgb(255 249 232 / 0.4);
  border: 1px solid rgb(90 65 38 / 0.4);
  outline: 1px solid rgb(90 65 38 / 0.25);
  outline-offset: 4px;
  transition: opacity 0.2s;
}

.carte[aria-busy='true'] {
  opacity: 0.6;
}

.rubrique {
  margin: 0 0 0.75rem;
  font-family: var(--font-titre);
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.1;
  color: var(--rubrique);
}

.rubrique-petite {
  margin-top: 1.5rem;
  font-size: 1.3rem;
}

.traduction {
  margin: 0;
  font-family: var(--font-vieux);
  font-size: 1.5rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.original {
  clear: left;
  margin: 1rem 0 0;
  font-style: italic;
  color: var(--encre-douce);
  overflow-wrap: anywhere;
}

.variantes {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.variante {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-vieux);
  font-size: 1.15rem;
  line-height: 1.35;
  text-align: left;
  color: var(--encre);
  background: transparent;
  border: 1px dashed rgb(90 65 38 / 0.55);
  border-radius: 0.3rem;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.variante:hover {
  background: rgb(90 65 38 / 0.08);
  border-style: solid;
}

.aide {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  color: var(--encre-douce);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.5rem;
}

.actions .bouton {
  flex: 1 1 10rem;
}

.actions svg {
  width: 1.15em;
  height: 1.15em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.retour {
  min-height: 1.55em;
  margin: 0.6rem 0 0;
  font-style: italic;
  color: var(--encre-douce);
}
</style>
