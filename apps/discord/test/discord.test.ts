import { describe, expect, it } from 'vitest'
import { formaterTraduction } from '../src/discord.ts'

describe('formaterTraduction', () => {
  it('cite le texte, met la traduction en gras et les variantes en petit', () => {
    const message = formaterTraduction('Merci\nbeaucoup', { traduction: 'Mille grasces', variantes: ['Grand mercy', 'Par ma foy, merci'] })
    expect(message).toBe('> Merci\n> beaucoup\n**Mille grasces**\n-# Grand mercy\n-# Par ma foy, merci')
  })

  it('sacrifie les variantes pour tenir dans les 2000 caractères de Discord', () => {
    const message = formaterTraduction('a'.repeat(500), {
      traduction: 'b'.repeat(700),
      variantes: ['c'.repeat(700), 'd'.repeat(700)],
    })
    expect(message.length).toBeLessThanOrEqual(2000)
    expect(message).toContain('b'.repeat(700))
    expect(message).not.toContain('d')
  })
})
