import { describe, expect, it } from 'vitest'
import { embedDiscord } from '../app/utils/embedDiscord.ts'

interface Composant {
  type: number
  components?: Composant[]
  accessory?: Composant
  [cle: string]: unknown
}

/** Le composant et tous ceux qu'il contient. */
function tous(composant: Composant): Composant[] {
  const enfants = [...(composant.components ?? []), ...(composant.accessory ? [composant.accessory] : [])]
  return [composant, ...enfants.flatMap(tous)]
}

const composants = tous(embedDiscord.component)

// Les règles de https://docs.discord.com/developers/link-previews/component-embeds : Discord
// n'affiche rien si l'une d'elles n'est pas respectée.
describe('aperçu des liens sur Discord', () => {
  it('tient dans 3 000 octets', () => {
    expect(new TextEncoder().encode(JSON.stringify(embedDiscord)).length).toBeLessThanOrEqual(3000)
  })

  it('a un seul conteneur, à la racine, et au plus 40 composants', () => {
    expect(Object.keys(embedDiscord)).toEqual(['component'])
    expect(composants.filter((composant) => composant.type === 17)).toEqual([embedDiscord.component])
    expect(composants.length).toBeLessThanOrEqual(40)
  })

  it("n'a que des boutons de lien, sans clé en trop", () => {
    const boutons = composants.filter((composant) => composant.type === 2)
    expect(boutons.length).toBeGreaterThan(0)
    for (const bouton of boutons) {
      expect(bouton.style).toBe(5)
      expect(bouton.url).toMatch(/^https:\/\//)
      expect(bouton.label).toBeTruthy()
      expect(['id', 'type', 'url', 'style', 'label', 'emoji', 'disabled']).toEqual(expect.arrayContaining(Object.keys(bouton)))
    }
  })
})
