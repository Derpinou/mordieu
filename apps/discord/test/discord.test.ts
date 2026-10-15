import { describe, expect, it } from 'vitest'
import { formaterTraduction } from '../src/discord.ts'

describe('formaterTraduction', () => {
  it('ne garde que la traduction principale', () => {
    expect(formaterTraduction({ traduction: 'Mille grasces' })).toBe('Mille grasces')
  })

  it('tient dans les 2000 caractères de Discord', () => {
    expect(formaterTraduction({ traduction: 'b'.repeat(2500) })).toBe('b'.repeat(2000))
  })
})
