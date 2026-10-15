<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const introuvable = computed(() => props.error.statusCode === 404)

useHead({ title: () => (introuvable.value ? 'Parchemin introuvable · Mordieu' : 'Diantre ! · Mordieu') })
</script>

<template>
  <main class="parchemin">
    <h1 class="titre">{{ introuvable ? 'Diantre !' : 'Mordieu !' }}</h1>
    <p v-if="introuvable" class="explication lettrine">
      Ce parchemin n’existe point : le scribe a beau fouiller ses coffres, il ne le trouve pas.
    </p>
    <p v-else class="explication lettrine">Le scribe a trébuché sur son encrier. Réessaie dans un instant.</p>
    <button type="button" class="bouton bouton-sceau" @click="clearError({ redirect: '/' })">Retour au scriptorium</button>
  </main>
</template>

<style scoped>
.parchemin {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.explication {
  margin: 1.75rem 0 1.5rem;
  align-self: stretch;
}
</style>
