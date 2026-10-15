<template>
  <PageLegale
    titre="Politique de confidentialité"
    description="Ce que Mordieu fait de tes textes et de tes données : presque rien, et rien de plus que nécessaire."
    mise-a-jour="2026-10-15"
  >
    <h2>En bref</h2>
    <ul>
      <li>Pas de compte, pas de publicité, pas de mesure d’audience, et aucun cookie déposé par le site.</li>
      <li>
        Ton texte part chez Cloudflare le temps de la traduction, puis il est oublié : il n’est ni conservé, ni utilisé
        pour entraîner une IA.
      </li>
      <li>Ton adresse IP ne sert qu’à protéger le site des abus.</li>
      <li>
        N’écris pas de données personnelles, les tiennes ou celles d’autrui, dans le texte à traduire : le scribe n’en a
        pas besoin.
      </li>
    </ul>

    <h2>Responsable du traitement</h2>
    <p>
      {{ EDITEUR }}, qui édite le site à titre non professionnel (voir les
      <NuxtLink to="/mentions-legales">mentions légales</NuxtLink>), joignable sur le
      <a :href="SERVEUR_DISCORD" rel="noopener">serveur Discord de Mordieu</a>.
    </p>

    <h2>Ce qui est traité, pourquoi, et combien de temps</h2>

    <h3>Le texte à traduire</h3>
    <p>
      Ce que tu écris est envoyé, avec les consignes de style, au modèle de langage qui le traduit. Copier la traduction
      ou télécharger l’image se passe entièrement dans ton navigateur : rien n’est envoyé.
    </p>
    <dl>
      <dt>Pourquoi</dt>
      <dd>Produire la traduction et ses variantes.</dd>
      <dt>Base légale</dt>
      <dd>L’intérêt légitime à te rendre le service que tu demandes (article 6.1.f du RGPD).</dd>
      <dt>Conservation</dt>
      <dd>
        Aucune : le texte et sa traduction n’existent que le temps de la requête et ne sont enregistrés nulle part. Seule
        exception, si le modèle répond de travers, le message d’erreur inscrit au journal technique peut contenir le
        début de sa réponse (voir plus bas).
      </dd>
    </dl>

    <h3>Ton adresse IP</h3>
    <dl>
      <dt>Pourquoi</dt>
      <dd>
        Compter tes traductions pour en limiter le nombre (10 par minute), et vérifier auprès de Turnstile que tu n’es
        pas un robot.
      </dd>
      <dt>Base légale</dt>
      <dd>L’intérêt légitime à protéger le site des abus (article 6.1.f du RGPD).</dd>
      <dt>Conservation</dt>
      <dd>Le compteur ne vit qu’une minute. Voir aussi les journaux techniques.</dd>
    </dl>

    <h3>Les signaux de Turnstile</h3>
    <p>
      Pour s’assurer que les traductions sont demandées par des humains, la page charge Turnstile, le service anti-robots
      de Cloudflare. Il analyse des signaux techniques de ton navigateur et de ta connexion : adresse IP, en-tête
      User-Agent, empreinte TLS. Cloudflare les traite pour le compte du site, et s’en sert aussi, comme responsable de
      traitement à part entière, pour améliorer sa détection des robots, sans chercher à t’identifier, te profiler ou te
      cibler : voir l’<a href="https://www.cloudflare.com/turnstile-privacy-policy/" rel="noopener"
        >addendum de confidentialité de Turnstile</a
      >.
    </p>
    <dl>
      <dt>Pourquoi</dt>
      <dd>Distinguer les humains des robots, qui épuiseraient le service.</dd>
      <dt>Base légale</dt>
      <dd>L’intérêt légitime à protéger le site des abus (article 6.1.f du RGPD).</dd>
      <dt>Conservation</dt>
      <dd>Fixée par Cloudflare.</dd>
    </dl>

    <h3>Les journaux techniques</h3>
    <p>
      Comme tout hébergeur, Cloudflare garde une trace des requêtes reçues par le site : date, adresse demandée, réponse
      et durée, informations techniques sur la connexion (dont ton adresse IP et ton navigateur), ainsi que les messages
      d’erreur du code.
    </p>
    <dl>
      <dt>Pourquoi</dt>
      <dd>Diagnostiquer les pannes et repérer les abus.</dd>
      <dt>Base légale</dt>
      <dd>L’intérêt légitime au bon fonctionnement et à la sécurité du site (article 6.1.f du RGPD).</dd>
      <dt>Conservation</dt>
      <dd>7 jours au plus, puis effacement automatique.</dd>
    </dl>

    <h3>Sur Discord</h3>
    <p>
      Quand tu utilises la commande <code>/mordieu</code> ou le menu « Traduire en vieux françois », Discord transmet au
      bot le texte à traduire, ton identifiant et ton pseudo Discord, ceux du serveur et du salon, et un jeton temporaire
      pour répondre. Le bot ne se sert que du texte, pour le traduire, et du jeton, pour publier la traduction ; il
      n’enregistre rien d’autre que les journaux techniques décrits plus haut. Traduire le message d’un autre traite son
      texte de la même façon. Discord reste responsable de ses propres traitements : voir sa
      <a href="https://discord.com/privacy" rel="noopener">politique de confidentialité</a>.
    </p>

    <h2>Destinataires et transferts hors de l’Union européenne</h2>
    <p>
      Les données ne sont ni vendues, ni louées, ni partagées à des fins publicitaires. Leur seul destinataire est
      Cloudflare, Inc., établi aux États-Unis, sous-traitant du site (article 28 du RGPD) pour l’hébergement, l’IA, le
      compteur, Turnstile et les journaux. Cloudflare s’engage à ne pas utiliser les textes envoyés à Workers AI pour
      entraîner des modèles (<a href="https://developers.cloudflare.com/workers-ai/platform/data-usage/" rel="noopener"
        >conditions d’utilisation des données de Workers AI</a
      >).
    </p>
    <p>
      Le réseau de Cloudflare s’étend sur le monde entier : les données peuvent être traitées hors de l’Union
      européenne, notamment aux États-Unis. Ces transferts reposent sur la certification de Cloudflare au Data Privacy
      Framework UE–États-Unis, reconnu par la décision d’adéquation de la Commission européenne du 10 juillet 2023, et à
      défaut sur les clauses contractuelles types de la Commission.
    </p>

    <h2>Cookies et traceurs</h2>
    <p>
      Le site ne dépose aucun cookie : ni mesure d’audience, ni publicité, ni bouton de réseau social. Ses polices sont
      servies par le site lui-même, sans appel à Google.
    </p>
    <p>
      Seul Turnstile, chargé depuis <code>challenges.cloudflare.com</code>, peut lire ou enregistrer dans ton navigateur
      les informations dont il a besoin pour reconnaître les robots. Strictement nécessaires à la sécurité du service que
      tu demandes, ces traceurs sont dispensés de consentement (article 82 de la loi Informatique et Libertés) : c’est
      pourquoi le site n’affiche pas de bandeau. Si ton navigateur les bloque, le guet ne pourra pas te reconnaître et la
      traduction sera refusée.
    </p>

    <h2>Tes droits</h2>
    <p>
      Le RGPD te donne un droit d’accès, de rectification, d’effacement, de limitation et d’opposition sur tes données
      (articles 15 à 21). Le site ne gardant presque rien, il n’y aura souvent rien à te montrer ni à effacer, mais tu
      peux toujours demander : écris sur le <a :href="SERVEUR_DISCORD" rel="noopener">serveur Discord de Mordieu</a>.
      Réponse sous un mois.
    </p>
    <p>
      Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL, sur
      <a href="https://www.cnil.fr/fr/plaintes" rel="noopener">cnil.fr/fr/plaintes</a> ou par courrier : CNIL, 3 place de
      Fontenoy, TSA 80715, 75334 Paris Cedex 07.
    </p>

    <h2>Modifications</h2>
    <p>
      Cette politique suit le site : si ce qu’il traite change, elle change aussi, et sa date de mise à jour avec.
    </p>
  </PageLegale>
</template>
