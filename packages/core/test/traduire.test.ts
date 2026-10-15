import { MockLanguageModelV4 } from 'ai/test'
import { describe, expect, it } from 'vitest'
import { promptSysteme } from '../src/prompt.ts'
import { LONGUEUR_MAX, TexteInvalide, traduire } from '../src/traduire.ts'

/** Faux modèle qui renvoie ces réponses, une par appel. */
function modeleQuiRepond(...reponses: string[]) {
  return new MockLanguageModelV4({
    doGenerate: reponses.map((text) => ({
      content: [{ type: 'text' as const, text }],
      finishReason: { unified: 'stop' as const, raw: undefined },
      usage: {
        inputTokens: { total: 100, noCache: 100, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      warnings: [],
    })),
  })
}

const json = (traduction: string, variantes: string[] = []) => JSON.stringify({ traduction, variantes })

describe('traduire', () => {
  it('renvoie la traduction et les variantes nettoyées', async () => {
    const modele = modeleQuiRepond(json('« Mille grasces »', ['Grand merci, messire', 'Mille grasces']))
    const resultat = await traduire(modele, 'Merci beaucoup')
    expect(resultat).toMatchObject({ traduction: 'Mille grasces', variantes: ['Grand merci, messire'] })
    expect(resultat.usage.inputTokens).toBe(100)
  })

  it('envoie le texte entre balises, sans les espaces autour', async () => {
    const modele = modeleQuiRepond(json('Salutations'))
    await traduire(modele, '  Bonjour  ')
    expect(JSON.stringify(modele.doGenerateCalls[0]?.prompt)).toContain('<texte>Bonjour</texte>')
  })

  it('demande des variantes par défaut', async () => {
    const modele = modeleQuiRepond(json('Salutations'))
    await traduire(modele, 'Bonjour')
    expect(modele.doGenerateCalls[0]?.prompt[0]).toMatchObject({ role: 'system', content: promptSysteme(true) })
  })

  it('relève la limite de tokens (256 par défaut sur Workers AI)', async () => {
    const modele = modeleQuiRepond(json('Salutations'))
    await traduire(modele, 'Bonjour')
    expect(modele.doGenerateCalls[0]?.maxOutputTokens).toBeGreaterThan(1000)
  })

  it('sans variantes : ne les demande pas, avec une limite de tokens plus basse', async () => {
    const modele = modeleQuiRepond(JSON.stringify({ traduction: '« Mille grasces »' }))
    const resultat = await traduire(modele, 'Merci beaucoup', { variantes: false })
    expect(resultat).toMatchObject({ traduction: 'Mille grasces', variantes: [] })
    const appel = modele.doGenerateCalls[0]
    expect(appel?.prompt[0]).toMatchObject({ role: 'system', content: promptSysteme(false) })
    expect(appel?.maxOutputTokens).toBeGreaterThan(256)
    expect(appel?.maxOutputTokens).toBeLessThan(1000)
  })

  it('sans variantes : écarte celles que le modèle ajoute quand même', async () => {
    const modele = modeleQuiRepond(json('Mille grasces', ['Grand merci, messire']))
    expect((await traduire(modele, 'Merci beaucoup', { variantes: false })).variantes).toEqual([])
  })

  it('accepte une réponse sans variantes, sans relancer', async () => {
    const modele = modeleQuiRepond(JSON.stringify({ traduction: 'Mille grasces' }))
    expect(await traduire(modele, 'Merci beaucoup')).toMatchObject({ traduction: 'Mille grasces', variantes: [] })
    expect(modele.doGenerateCalls).toHaveLength(1)
  })

  it('retrouve le JSON dans une réponse bavarde', async () => {
    const modele = modeleQuiRepond(`Voici :\n\`\`\`json\n${json('Mordieu !', ['Diantre !'])}\n\`\`\``)
    expect(await traduire(modele, 'Zut !')).toMatchObject({ traduction: 'Mordieu !', variantes: ['Diantre !'] })
  })

  it('relance une fois si la sortie est inutilisable', async () => {
    const modele = modeleQuiRepond('pas du JSON', json('Salutations'))
    expect((await traduire(modele, 'Bonjour')).traduction).toBe('Salutations')
    expect(modele.doGenerateCalls).toHaveLength(2)
  })

  it('abandonne après deux échecs', async () => {
    const modele = modeleQuiRepond('pas du JSON', 'toujours pas')
    await expect(traduire(modele, 'Bonjour')).rejects.toThrow('pas renvoyé de JSON exploitable')
    expect(modele.doGenerateCalls).toHaveLength(2)
  })

  it('refuse un texte vide ou trop long sans appeler le modèle', async () => {
    const modele = modeleQuiRepond()
    await expect(traduire(modele, '   ')).rejects.toThrow(TexteInvalide)
    await expect(traduire(modele, 'a'.repeat(LONGUEUR_MAX + 1))).rejects.toThrow(TexteInvalide)
    expect(modele.doGenerateCalls).toHaveLength(0)
  })
})
