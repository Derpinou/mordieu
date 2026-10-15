<script setup lang="ts">
// L'attente, en images : la plume s'agite et le scribe change d'occupation. Purement décoratif :
// la page annonce l'attente aux lecteurs d'écran une seule fois.
const OCCUPATIONS = [
  'Le scribe trempe sa plume…',
  'Il cherche le juron qui sied…',
  'Il gratte le vélin…',
  'Il souffle sur l’encre…',
]

const index = ref(0)
let minuteur: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  minuteur = setInterval(() => (index.value = (index.value + 1) % OCCUPATIONS.length), 2200)
})
onBeforeUnmount(() => clearInterval(minuteur))
</script>

<template>
  <p class="scribe" aria-hidden="true">
    <svg class="plume" viewBox="0 0 32 32">
      <path d="M27 3C17 5 10 12 7.5 22.5L6 28l2-1.5C13 15 19 9 27 3Z" />
      <path class="tige" d="M6 28 17 14" />
    </svg>
    {{ OCCUPATIONS[index] }}
  </p>
</template>

<style scoped>
.scribe {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1.5rem 0 0;
  font-style: italic;
  font-size: 1.2rem;
  color: var(--encre-douce);
}

.plume {
  flex: none;
  width: 2rem;
  height: 2rem;
  fill: var(--rubrique);
  transform-origin: 20% 90%;
  animation: ecrire 0.9s ease-in-out infinite;
}

.tige {
  fill: none;
  stroke: var(--parchemin);
  stroke-width: 1;
  opacity: 0.7;
}

@keyframes ecrire {
  0%,
  100% {
    transform: rotate(-8deg) translateX(0);
  }
  50% {
    transform: rotate(6deg) translateX(3px);
  }
}
</style>
