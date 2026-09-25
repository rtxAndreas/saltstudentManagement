# Gestion scolaire

Application Next.js de gestion des élèves, classes, cours, notes et emplois du temps.

## Base de données

L’application utilise une seule base SQLite : `dev.db` à la racine du projet.
Elle est configurée par `DATABASE_URL="file:./dev.db"` dans `.env` et constitue également la valeur par défaut de `prisma.config.ts`.

Les commandes Prisma doivent être exécutées depuis la racine du projet :

```bash
pnpm prisma validate
pnpm prisma migrate status
pnpm prisma generate
```

Ne pas utiliser ou recréer `prisma/dev.db`, qui correspond à une ancienne base.

## Développement

```bash
pnpm install
pnpm dev
```

Le projet utilise Node.js `24.18.0` (voir `.nvmrc`). Après un changement de version de Node.js, reconstruire le module SQLite natif :

```bash
pnpm rebuild better-sqlite3
```

Variables nécessaires dans `.env` : `DATABASE_URL`, `JWT_SECRET` et `ADMIN_EMAIL`.

## Documentation

- [Cahier des charges fonctionnel](./CAHIER_DES_CHARGES.md)
- [Plan de réalisation](./PLAN_REALISATION.md)
- [Journal des tâches et prochaines étapes](./TASKS.md)
