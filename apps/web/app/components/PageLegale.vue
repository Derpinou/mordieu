<script setup lang="ts">
// Mise en page commune aux mentions légales et à la politique de confidentialité.
const props = defineProps<{
  titre: string
  description: string
  /** Date de la dernière modification du texte, au format AAAA-MM-JJ. */
  miseAJour: string
}>()

useHead({ title: `${props.titre} · Mordieu` })
useSeoMeta({ description: props.description })

const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(props.miseAJour))
</script>

<template>
  <main class="parchemin legal">
    <NuxtLink to="/" class="retour">← Retour au scriptorium</NuxtLink>
    <h1 class="titre">{{ titre }}</h1>
    <p class="maj">Mise à jour le <time :datetime="miseAJour">{{ date }}</time></p>
    <p class="avertissement">
      Ici, le scribe pose sa plume d’oie : le droit ne badine point, ces pages sont donc en français d’aujourd’hui.
    </p>
    <slot />
  </main>
</template>

<style scoped>
.retour {
  font-size: 1rem;
  color: var(--encre-douce);
}

.titre {
  margin-top: 1.25rem;
  font-size: clamp(2.4rem, 10vw, 3.5rem);
  overflow-wrap: break-word;
}

.maj {
  margin: 0.5rem 0 0;
  font-style: italic;
  text-align: center;
  color: var(--encre-douce);
}

.avertissement {
  margin: 1.5rem 0 0;
  padding: 0.6rem 0.9rem;
  font-family: var(--font-vieux);
  border-left: 3px solid var(--or);
  background: rgb(255 249 232 / 0.4);
}

.legal :deep(h2) {
  margin: 2rem 0 0.5rem;
  font-family: var(--font-titre);
  font-size: 1.6rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--rubrique);
}

.legal :deep(h3) {
  margin: 1.5rem 0 0.25rem;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.3;
}

.legal :deep(p),
.legal :deep(ul),
.legal :deep(dl),
.legal :deep(address) {
  margin: 0.6rem 0 0;
}

.legal :deep(ul) {
  padding-left: 1.25rem;
}

.legal :deep(li + li) {
  margin-top: 0.35rem;
}

.legal :deep(address) {
  font-style: normal;
}

.legal :deep(dt) {
  font-weight: 600;
}

.legal :deep(dd) {
  margin: 0 0 0.5rem;
}

@media (min-width: 40rem) {
  .legal :deep(dl) {
    display: grid;
    grid-template-columns: 8.5rem 1fr;
    gap: 0.4rem 1rem;
  }

  .legal :deep(dd) {
    margin: 0;
  }
}

.legal a,
.legal :deep(a) {
  color: var(--azur);
  text-underline-offset: 0.15em;
  overflow-wrap: anywhere;
}
</style>
