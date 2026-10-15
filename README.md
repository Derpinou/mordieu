# Mordieu

> Mordieu mien fraternel, nous allons tout mettre à sac !

Traducteur du français moderne vers un faux vieux français, façon memes médiévaux. Un site web et un bot Discord, hébergés sur Cloudflare Workers et propulsés par Workers AI.

## Structure

- `packages/core` : moteur de traduction partagé. Les règles du style sont dans [`packages/core/prompt/regles.md`](packages/core/prompt/regles.md).
- `apps/discord` : bot Discord *(à venir)*
- `apps/web` : site *(à venir)*

## Développement

Node 24 et pnpm 11 :

```sh
pnpm install
pnpm typecheck
```
