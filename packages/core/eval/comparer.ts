// Compare les modèles candidats sur eval/phrases.ts et écrit un rapport dans eval/resultats/.
// Passe par ton `wrangler login` : chaque appel consomme du quota Workers AI.
// Usage : pnpm eval [--modeles mistral-small,gemma-4] [--phrases 3] [--sans-variantes]
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import type { LanguageModelUsage } from 'ai'
import { getPlatformProxy } from 'wrangler'
import { MODELES, modeleWorkersAI, type NomModele, type Traduction, traduire } from '../src/index.ts'
import { type Phrase, phrases } from './phrases.ts'

// Neurons facturés par million de tokens, d'après la grille tarifaire de Workers AI.
const NEURONS: Record<NomModele, { entree: number; sortie: number }> = {
  'mistral-small': { entree: 31_876, sortie: 50_488 },
  'gemma-4': { entree: 9_091, sortie: 27_273 },
  'glm-4.7-flash': { entree: 5_500, sortie: 36_400 },
  'gpt-oss-120b': { entree: 31_818, sortie: 68_182 },
  'llama-3.3-70b': { entree: 26_668, sortie: 204_805 },
}
const NEURONS_GRATUITS_PAR_JOUR = 10_000

const JURON = /\b(?:mordieu|palsambleu|ventrebleu|diantre|morbleu|par ma foy|sacrebleu|tudieu|par la barbe|corbleu|parbleu)\b/i
const CHIFFRES_ROMAINS = /\b(?=[MDCLXVI]{2,}\b)M*(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})\b/

interface Essai {
  phrase: Phrase
  duree: number
  resultat?: Traduction
  erreur?: string
}

const { values } = parseArgs({
  options: { modeles: { type: 'string' }, phrases: { type: 'string' }, 'sans-variantes': { type: 'boolean' } },
})
const demandes = values.modeles?.split(',') ?? Object.keys(MODELES)
const inconnus = demandes.filter((nom) => !(nom in MODELES))
if (inconnus.length) throw new Error(`Modèles inconnus : ${inconnus.join(', ')}`)
const noms = demandes as NomModele[]
const corpus = values.phrases ? phrases.slice(0, Number(values.phrases)) : phrases
// --sans-variantes : le mode du bot Discord, qui ne publie que la traduction principale.
const variantes = !values['sans-variantes']

const { env, dispose } = await getPlatformProxy<{ AI: Parameters<typeof modeleWorkersAI>[0] }>({
  configPath: fileURLToPath(new URL('wrangler.jsonc', import.meta.url)),
})

async function essayer(nom: NomModele, phrase: Phrase): Promise<Essai> {
  const debut = performance.now()
  try {
    const resultat = await traduire(modeleWorkersAI(env.AI, nom), phrase.texte, { variantes })
    return { phrase, resultat, duree: performance.now() - debut }
  } catch (erreur) {
    return { phrase, erreur: erreur instanceof Error ? erreur.message : String(erreur), duree: performance.now() - debut }
  }
}

// Les modèles tournent en parallèle, les phrases à la suite pour chaque modèle.
console.log(`${corpus.length} phrases × ${noms.length} modèles…`)
const essais = new Map(
  await Promise.all(
    noms.map(async (nom) => {
      const liste: Essai[] = []
      for (const phrase of corpus) {
        liste.push(await essayer(nom, phrase))
        process.stdout.write('.')
      }
      return [nom, liste] as const
    }),
  ),
)
await dispose()

function neurons(nom: NomModele, usage: LanguageModelUsage | undefined): number | undefined {
  if (usage?.inputTokens === undefined || usage.outputTokens === undefined) return undefined
  const { entree, sortie } = NEURONS[nom]
  return (usage.inputTokens * entree + usage.outputTokens * sortie) / 1e6
}

/** Défauts repérables automatiquement ; le reste (l'humour !) se juge à la lecture. */
function alertes({ phrase, resultat, erreur }: Essai): string[] {
  if (erreur !== undefined) return [`erreur : ${erreur}`]
  if (!resultat) return []
  const liste: string[] = []
  if ([resultat.traduction, ...resultat.variantes].some((sortie) => CHIFFRES_ROMAINS.test(sortie))) {
    liste.push('chiffres romains')
  }
  for (const signe of ['?', '!']) {
    if (phrase.texte.includes(signe) && !resultat.traduction.includes(signe)) liste.push(`« ${signe} » perdu`)
  }
  if (resultat.traduction.length > 3 * phrase.texte.length + 80) liste.push('longueur suspecte')
  if (variantes && resultat.variantes.length < 2) liste.push(`${resultat.variantes.length} variante(s)`)
  return liste
}

const nombre = (n: number, decimales = 0) => n.toLocaleString('fr-FR', { maximumFractionDigits: decimales })
const pourcent = (part: number, total: number) => (total ? `${Math.round((100 * part) / total)} %` : '—')
const moyenne = (valeurs: number[]) => (valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : 0)
const mediane = (valeurs: number[]) => [...valeurs].sort((a, b) => a - b)[Math.floor(valeurs.length / 2)] ?? 0

function ligneSynthese(nom: NomModele, liste: Essai[]): string {
  const reussis = liste.flatMap((essai) => (essai.resultat ? [essai.resultat] : []))
  const cout = moyenne(reussis.flatMap((resultat) => neurons(nom, resultat.usage) ?? []))
  const avecSigne = liste.filter((essai) => essai.resultat && /[?!]/.test(essai.phrase.texte))
  const signesGardes = avecSigne.filter((essai) => !alertes(essai).some((alerte) => alerte.endsWith('perdu')))
  return [
    nom,
    `${reussis.length}/${liste.length}`,
    `${nombre(mediane(liste.map((essai) => essai.duree)) / 1000, 1)} s`,
    `${nombre(moyenne(reussis.map((resultat) => resultat.usage.inputTokens ?? 0)))} / ${nombre(moyenne(reussis.map((resultat) => resultat.usage.outputTokens ?? 0)))}`,
    nombre(cout),
    cout ? nombre(NEURONS_GRATUITS_PAR_JOUR / cout) : '—',
    pourcent(reussis.filter((resultat) => JURON.test(resultat.traduction)).length, reussis.length),
    pourcent(signesGardes.length, avecSigne.length),
    String(liste.filter((essai) => alertes(essai).length > 0).length),
  ].join(' | ')
}

const horodatage = new Date().toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
const synthese = [
  '| Modèle | Réussites | Latence médiane | Tokens entrée / sortie | ≈ Neurons par traduction | Traductions gratuites par jour | Avec juron | Ponctuation gardée | Phrases avec alerte |',
  '|---|---|---|---|---|---|---|---|---|',
  ...noms.map((nom) => `| ${ligneSynthese(nom, essais.get(nom) ?? [])} |`),
]
const lignes = [
  `# Comparaison des modèles, ${horodatage}`,
  '',
  `${corpus.length} phrases × ${noms.length} modèles${variantes ? '' : ', sans variantes'}. Coûts estimés d'après la grille Workers AI (${nombre(NEURONS_GRATUITS_PAR_JOUR)} neurons gratuits par jour).`,
  '',
  '## Synthèse',
  '',
  ...synthese,
  '',
  '## Traductions',
]
corpus.forEach((phrase, i) => {
  lignes.push('', `### ${i + 1}. ${phrase.texte}${phrase.piege ? ' *(piège)*' : ''}`, '')
  for (const nom of noms) {
    const essai = essais.get(nom)?.[i]
    if (!essai) continue
    const avertissements = alertes(essai)
    const note = avertissements.length ? ` ⚠️ ${avertissements.join(', ')}` : ''
    if (!essai.resultat) {
      lignes.push(`- **${nom}** :${note}`)
      continue
    }
    lignes.push(`- **${nom}** : ${essai.resultat.traduction} *(${nombre(essai.duree / 1000, 1)} s)*${note}`)
    for (const variante of essai.resultat.variantes) lignes.push(`  - ${variante}`)
  }
})

const dossier = new URL('resultats/', import.meta.url)
mkdirSync(dossier, { recursive: true })
const fichier = new URL(`${horodatage.replace(' ', '-').replace(':', '')}.md`, dossier)
writeFileSync(fichier, `${lignes.join('\n')}\n`)
console.log(`\n\n${synthese.join('\n')}\n\nRapport : ${fileURLToPath(fichier)}`)
