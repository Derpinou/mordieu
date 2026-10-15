<template>
  <NuxtPage />

  <footer class="pied">
    <p>
      Traductions générées par une IA, Workers AI de Cloudflare. Ton texte ne sert qu’à la traduction : le site n’en
      garde rien.
    </p>
    <nav aria-label="Liens" class="liens">
      <a :href="SERVEUR_DISCORD" rel="noopener">Rejoindre le serveur Discord</a>
      <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
      <NuxtLink to="/confidentialite">Confidentialité</NuxtLink>
    </nav>
  </footer>
</template>

<style scoped>
.pied {
  width: min(100% - 2rem, 44rem);
  margin: 0 auto;
  padding: 0.5rem 0 2rem;
  font-size: 0.95rem;
  text-align: center;
  color: rgb(242 227 196 / 0.8);
}

.pied p {
  margin: 0;
}

.liens {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1.5rem;
  margin-top: 0.5rem;
}

.liens a {
  /* Cible tactile confortable sans grossir le texte. */
  padding: 0.35rem 0;
  color: inherit;
  text-underline-offset: 0.15em;
}

.liens a:hover {
  color: var(--parchemin);
}
</style>
