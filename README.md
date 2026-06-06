# aqua-purify-lux-tools

Outil Aqua Purify de simulation et de dimensionnement.

## Source de vérité des données

⚠️ **Règle d'or très importante : Google Sheets est le maître.**

Les fichiers JSON suivants ne doivent jamais être modifiés directement sur GitHub :

- `src/data/produits.json`
- `src/data/communes.json`

Si une personne modifie directement ces fichiers sur GitHub, la prochaine synchronisation depuis Google Sheets écrasera ces modifications. Le bouton **Synchroniser le Simulateur** dans Google Sheets a toujours le dernier mot.

L'avantage de ce fonctionnement est que les commerciaux, techniciens ou assistants n'ont besoin d'aucune compétence en code. S'ils savent remplir un tableau de type Excel, ils peuvent mettre à jour la base de données des outils Aqua Purify en temps réel, sans risque de casser le site web.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Déploiement Cloudflare Workers

Le projet est déployé avec Cloudflare Workers + Assets via Wrangler.

```bash
npm run build
npm run deploy
```

URL de production :

```text
https://aqua-purify-lux-tools.msolinas.workers.dev
```
