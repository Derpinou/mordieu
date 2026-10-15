# Bot Discord

Endpoint d'interactions HTTP hébergé sur Cloudflare Workers, sans connexion Gateway : le bot apparaît hors ligne, c'est normal.

- `/mordieu texte: [discret:]` traduit le texte ; avec `discret`, toi seul vois la réponse.
- Clic droit sur un message, **Applications > Traduire en vieux françois** : traduit le message d'un autre.

## Mise en route

Aucune clé dans le dépôt : la clé publique est un secret du Worker, et le jeton du bot ne quitte pas ta machine. Le déploiement passe par Workers Builds : chaque push sur `main` qui touche le bot le redéploie.

1. **Créer l'application** sur le [Developer Portal](https://discord.com/developers/applications) : *New Application*.
2. **Clé publique** : copier *General Information > Public Key*, lancer `pnpm --filter @mordieu/discord exec wrangler secret put DISCORD_PUBLIC_KEY` et la coller. Si le Worker `mordieu-discord` n'existe pas encore, wrangler propose de le créer. `wrangler.jsonc` déclare ce secret comme requis : tout déploiement échoue tant qu'il manque.
3. **Brancher GitHub** : dans le tableau de bord Cloudflare, *Workers & Pages > mordieu-discord > Settings > Builds > Connect*, dépôt `Derpinou/mordieu`, puis :
   - branche `main`, root directory `apps/discord` ;
   - build command `pnpm install --frozen-lockfile && pnpm typecheck && pnpm test` : si un test échoue, rien n'est déployé ;
   - deploy command `npx wrangler deploy` (celle par défaut) : wrangler bundle `src/index.ts` lui-même ;
   - variables de build `PNPM_VERSION=11.20.0` (l'image fournit pnpm 10) et `SKIP_DEPENDENCY_INSTALL=1` (l'installation automatique de Cloudflare n'est pas documentée pour un workspace vu depuis un sous-dossier : la build command s'en charge) ;
   - build watch paths `apps/discord/*`, `packages/*`, `pnpm-lock.yaml`. Les builds des autres branches ne servent à rien : Discord n'appelle que la production.

   Le prochain push sur `main` déploie le bot ; pour ne pas attendre : `pnpm --filter @mordieu/discord deploy`.
4. **Vérifier** : `curl https://mordieu-discord.<sous-domaine>.workers.dev` doit répondre « Mordieu ! Ici, on ne répond qu'aux interactions Discord. ».
5. **Brancher l'endpoint** : coller cette URL dans *General Information > Interactions Endpoint URL*, puis *Save Changes*. Discord vérifie l'endpoint sur-le-champ ; s'il refuse, le secret `DISCORD_PUBLIC_KEY` est faux.
6. **Enregistrer les commandes** : *Bot > Reset Token*, copier le jeton dans `apps/discord/.env` (sur le modèle de `.env.example`), puis `pnpm --filter @mordieu/discord commandes`. Le jeton ne sert qu'à ce script : ni le Worker ni le CI n'en ont besoin. Les commandes peuvent mettre quelques minutes à apparaître.
7. **Installer** : dans *Installation*, cocher *Guild Install* et *User Install*, avec le seul scope `applications.commands` (le scope `bot` est inutile), puis ouvrir le lien d'installation. Pour être seul à pouvoir l'installer : passer d'abord *Install Link* sur *None* (Discord refuse de rendre privé un bot qui a un lien d'installation), décocher *Bot > Public Bot*, puis générer le lien dans *OAuth2 > URL Generator*.

Après une modification, le push suffit pour le code ; `commandes` reste à relancer à la main quand `src/commandes.ts` change.

## Développement

`pnpm --filter @mordieu/discord test` vérifie la signature, le routage et le format des messages avec une fausse IA. Pour essayer avec Discord, le plus simple est de déployer : en local, il faudrait exposer `wrangler dev` par un tunnel, avec `DISCORD_PUBLIC_KEY` dans `.env` (wrangler n'y lit que les secrets déclarés dans `wrangler.jsonc`, pas le jeton).
