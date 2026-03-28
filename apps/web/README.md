# JE DEVIENS PATRON Web App

Application Next.js 15 pour le jeu sérieux de comptabilité JE DEVIENS PATRON.

## Démarrage local

Depuis la racine du monorepo :

```bash
npm run dev:web
```

L’application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d’environnement

Créez [`apps/web/.env.local`](/Users/pierremedan/Projects/jedevienspatron-github/apps/web/.env.local) à partir de l’exemple :

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Variables nécessaires :

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Vérifications utiles

```bash
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
npm run test
```

## Déploiement Vercel

1. Ajoutez les variables d’environnement de production dans Vercel.
2. Déployez l’app `apps/web` comme projet Next.js.
3. Configurez le webhook Stripe vers `https://votre-domaine/api/stripe/webhook`.
4. Exécutez les migrations Supabase avant de rendre le flux d’achat public.

Pour un preview deploy via CLI :

```bash
vercel deploy apps/web --no-wait
```
