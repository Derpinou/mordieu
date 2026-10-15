import { describe, expect, it } from 'vitest'
import { signatureValide } from '../src/signature.ts'
import { autresCles, clePublique, signer } from './aides.ts'

describe('signatureValide', () => {
  const horodatage = '1792053809'
  const corps = '{"type":1}'

  it('accepte une signature de Discord', async () => {
    expect(await signatureValide(corps, await signer(horodatage + corps), horodatage, clePublique)).toBe(true)
  })

  it('refuse un corps modifié', async () => {
    expect(await signatureValide('{"type":2}', await signer(horodatage + corps), horodatage, clePublique)).toBe(false)
  })

  it('refuse une signature faite avec une autre clé', async () => {
    const signature = await signer(horodatage + corps, autresCles.privateKey)
    expect(await signatureValide(corps, signature, horodatage, clePublique)).toBe(false)
  })

  it('refuse les en-têtes manquants ou une clé mal configurée, sans lever d’erreur', async () => {
    expect(await signatureValide(corps, null, horodatage, clePublique)).toBe(false)
    expect(await signatureValide(corps, await signer(horodatage + corps), null, clePublique)).toBe(false)
    expect(await signatureValide(corps, await signer(horodatage + corps), horodatage, '')).toBe(false)
    expect(await signatureValide(corps, 'pas-de-l-hexa', horodatage, clePublique)).toBe(false)
  })
})
