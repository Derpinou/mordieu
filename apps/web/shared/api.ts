// Contrat de POST /api/traduire, partagé entre la page et la route.

export interface DemandeTraduction {
  texte: string
  /** Jeton du widget Turnstile ; chacun ne sert qu'une fois. */
  jeton: string
}

export interface ReponseTraduction {
  traduction: string
  variantes: string[]
}

/** Réponse de toute requête refusée ou ratée : un message à montrer tel quel. */
export interface ReponseErreur {
  erreur: string
}
