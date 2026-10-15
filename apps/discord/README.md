# Bot Discord

Endpoint d'interactions HTTP hébergé sur Cloudflare Workers, sans connexion Gateway : le bot apparaît hors ligne, c'est normal.

- `/mordieu texte: [discret:]` traduit le texte ; avec `discret`, toi seul vois la réponse.
- Clic droit sur un message, **Applications > Traduire en vieux françois** : traduit le message d'un autre.

## Mise en route

1. **Créer l'application** sur le [Developer Portal](https://discord.com/developers/applications) : *New Application*.
2. **Clé publique** : copier *General Information > Public Key* dans `wrangler.jsonc` (`DISCORD_PUBLIC_KEY`). Elle n'a rien de secret.
3. **Déployer** : `pnpm --filter @mordieu/discord deploy`, et noter l'URL `https://mordieu-discord.<sous-domaine>.workers.dev`. Au premier déploiement, wrangler peut demander de choisir le sous-domaine `workers.dev`.
4. **Brancher l'endpoint** : coller cette URL dans *General Information > Interactions Endpoint URL*, puis *Save Changes*. Discord vérifie l'endpoint sur-le-champ ; si l'enregistrement échoue, la clé publique est fausse.
5. **Enregistrer les commandes** : *Bot > Reset Token*, copier le jeton dans `apps/discord/.env` (sur le modèle de `.env.example`), puis `pnpm --filter @mordieu/discord commandes`. Le jeton ne sert qu'à ce script, le Worker n'en a pas besoin. Les commandes peuvent mettre quelques minutes à apparaître.
6. **Installer** : dans *Installation*, cocher *Guild Install* et *User Install*, avec le seul scope `applications.commands` (le scope `bot` est inutile), puis ouvrir le lien d'installation. Pour être seul à pouvoir l'installer, décocher *Bot > Public Bot*.

À relancer après chaque modification : `deploy` pour le code, `commandes` pour `src/commandes.ts`.

## Développement

`pnpm --filter @mordieu/discord test` vérifie la signature, le routage et le format des messages avec une fausse IA. Pour essayer avec Discord, le plus simple est de déployer : en local, il faudrait exposer `wrangler dev` par un tunnel.
