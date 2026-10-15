// Génère src/regles.gen.ts depuis prompt/regles.md. Le prompt devient un module TypeScript
// ordinaire, importable partout (Workers, Nitro, Node, Vitest) sans configuration de bundler.
import { readFileSync, writeFileSync } from 'node:fs'

const regles = readFileSync(new URL('../prompt/regles.md', import.meta.url), 'utf8')

writeFileSync(
  new URL('../src/regles.gen.ts', import.meta.url),
  `// Généré par scripts/regles.ts depuis prompt/regles.md : ne pas modifier à la main.
export const regles = ${JSON.stringify(regles)}
`,
)
