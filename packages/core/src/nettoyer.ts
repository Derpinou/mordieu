export interface Traductions {
  traduction: string
  variantes: string[]
}

const PREFIXE = /^(?:voici (?:la |une )?traduction|traduction(?: principale)?)\s*:\s*/i
const GUILLEMETS = [/^«\s*([^«»]*?)\s*»$/s, /^"([^"]*)"$/s, /^“([^“”]*)”$/s]

/** Nettoie une phrase du modèle : s long, espaces, préfixe bavard, guillemets autour de toute la phrase. */
export function nettoyerPhrase(phrase: string): string {
  const propre = phrase.replaceAll('ſ', 's').replace(/\s+/g, ' ').trim().replace(PREFIXE, '')
  for (const motif of GUILLEMETS) {
    const entre = motif.exec(propre)?.[1]
    if (entre !== undefined) return entre.trim()
  }
  return propre
}

/** Nettoie la sortie du modèle et ne garde que des variantes distinctes (3 au plus). */
export function nettoyer({ traduction, variantes }: Traductions): Traductions {
  const principale = nettoyerPhrase(traduction)
  const dejaVues = new Set([principale.toLowerCase()])
  const distinctes: string[] = []
  for (const variante of variantes.map(nettoyerPhrase)) {
    const cle = variante.toLowerCase()
    if (variante && !dejaVues.has(cle)) {
      dejaVues.add(cle)
      distinctes.push(variante)
    }
  }
  return { traduction: principale, variantes: distinctes.slice(0, 3) }
}
