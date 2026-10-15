// Envoie à Discord la liste des commandes du bot (à relancer quand src/commandes.ts change).
// Usage : pnpm --filter @mordieu/discord commandes, avec DISCORD_TOKEN dans apps/discord/.env
import { COMMANDES } from '../src/commandes.ts'

const API = 'https://discord.com/api/v10'
const jeton = process.env.DISCORD_TOKEN
if (!jeton) throw new Error('DISCORD_TOKEN manquant : copie .env.example en .env et remplis-le.')
const entetes = { Authorization: `Bot ${jeton}`, 'Content-Type': 'application/json' }

const moi = await fetch(`${API}/applications/@me`, { headers: entetes })
if (!moi.ok) throw new Error(`Discord refuse ce jeton (${moi.status}).`)
const application = (await moi.json()) as { id: string; name: string }

const reponse = await fetch(`${API}/applications/${application.id}/commands`, {
  method: 'PUT',
  headers: entetes,
  body: JSON.stringify(COMMANDES),
})
if (!reponse.ok) throw new Error(`Discord a refusé les commandes (${reponse.status}) : ${await reponse.text()}`)
console.log(`${COMMANDES.length} commandes enregistrées pour « ${application.name} ».`)
