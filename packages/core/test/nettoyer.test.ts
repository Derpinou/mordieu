import { describe, expect, it } from 'vitest'
import { nettoyer, nettoyerPhrase } from '../src/nettoyer.ts'

describe('nettoyerPhrase', () => {
  it('remplace le s long', () => {
    expect(nettoyerPhrase('Ceſte feſte')).toBe('Ceste feste')
  })

  it('retire un préfixe bavard', () => {
    expect(nettoyerPhrase('Voici la traduction : Mordieu !')).toBe('Mordieu !')
    expect(nettoyerPhrase('Traduction principale: Mille grasces')).toBe('Mille grasces')
  })

  it('retire les guillemets qui entourent toute la phrase', () => {
    expect(nettoyerPhrase('« Mille grasces »')).toBe('Mille grasces')
    expect(nettoyerPhrase('"Mille grasces"')).toBe('Mille grasces')
    expect(nettoyerPhrase('“Mille grasces”')).toBe('Mille grasces')
    expect(nettoyerPhrase('Traduction : « Mordieu ! »')).toBe('Mordieu !')
  })

  it('garde les guillemets internes', () => {
    const phrase = "« Diantre » dit-il, « c'estoit moult laid »"
    expect(nettoyerPhrase(phrase)).toBe(phrase)
  })

  it('normalise les espaces', () => {
    expect(nettoyerPhrase('  Mordieu,\n  mien   fraternel ! ')).toBe('Mordieu, mien fraternel !')
  })
})

describe('nettoyer', () => {
  it('écarte les variantes vides, en double ou identiques à la traduction', () => {
    const sortie = nettoyer({
      traduction: 'Mille grasces',
      variantes: ['mille grasces', 'Grand merci, messire', '', 'Grand merci, messire'],
    })
    expect(sortie).toEqual({ traduction: 'Mille grasces', variantes: ['Grand merci, messire'] })
  })

  it('accepte une sortie sans variantes', () => {
    expect(nettoyer({ traduction: '« Mille grasces »' })).toEqual({ traduction: 'Mille grasces', variantes: [] })
  })

  it('garde au plus 3 variantes', () => {
    expect(nettoyer({ traduction: 'a', variantes: ['b', 'c', 'd', 'e'] }).variantes).toEqual(['b', 'c', 'd'])
  })
})
