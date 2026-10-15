<template>
  <PageLegale
    titre="Mentions légales"
    description="Qui édite et qui héberge Mordieu, le traducteur en faux vieux françois."
    mise-a-jour="2026-10-15"
  >
    <h2>Éditeur</h2>
    <p>
      Mordieu est un site gratuit et sans but commercial, édité à titre non professionnel par {{ EDITEUR }}, une
      personne physique. Comme le permet l’article 1-1, II de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
      l’économie numérique (LCEN), l’éditeur garde l’anonymat : ses éléments d’identification ont été communiqués à
      l’hébergeur. Le bot Discord Mordieu a le même éditeur.
    </p>
    <dl>
      <dt>Directeur de la publication</dt>
      <dd>{{ EDITEUR }}</dd>
      <dt>Contact</dt>
      <dd>
        sur le <a :href="SERVEUR_DISCORD" rel="noopener">serveur Discord de Mordieu</a>
      </dd>
    </dl>

    <h2>Hébergeur</h2>
    <address>
      Cloudflare, Inc.<br />
      101 Townsend St., San Francisco, CA 94107, États-Unis<br />
      Téléphone : <a href="tel:+16503198930">+1 650 319 8930</a><br />
      <a href="https://www.cloudflare.com/" rel="noopener">www.cloudflare.com</a>
    </address>

    <h2>Traductions générées par une IA</h2>
    <p>
      Les traductions sont produites automatiquement par un modèle de langage, exécuté par Workers AI, le service
      d’intelligence artificielle de Cloudflare. Ce faux vieux françois est une fantaisie, sans valeur historique ni
      linguistique, et l’IA peut se tromper, inventer ou écrire des choses inattendues. Tu restes responsable des textes
      que tu soumets et de l’usage que tu fais des traductions.
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      Les textes, le code et la mise en forme du site appartiennent à l’éditeur ; le code source est consultable sur
      <a href="https://github.com/Derpinou/mordieu" rel="noopener">GitHub</a>. Les polices Grenze Gotisch, EB Garamond
      et IM Fell English sont distribuées sous licence SIL Open Font License.
    </p>
    <p>
      Les textes que tu soumets restent les tiens, et l’éditeur ne revendique aucun droit sur les traductions : fais-en
      ce que bon te semble.
    </p>

    <h2>Données personnelles et cookies</h2>
    <p>
      Le site ne dépose aucun cookie et ne conserve pas tes textes. Ce qu’il traite, pourquoi et combien de temps :
      voir la <NuxtLink to="/confidentialite">politique de confidentialité</NuxtLink>.
    </p>
  </PageLegale>
</template>
