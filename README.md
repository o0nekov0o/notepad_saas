This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# 📝 Notepad SaaS (Éditeur de notes inspiré des IDE)

Application web moderne permettant de gérer des notes sous forme d’onglets, inspirée de Notepad++ et Visual Studio Code.

---

## 🚀 Fonctionnalités

- 🔐 Authentification utilisateur (Supabase Auth)
- 📝 Création, modification et suppression de notes
- 📑 Système multi-onglets (jusqu’à 15 ouverts)
- 🧠 Gestion intelligente des onglets :
  - Affichage automatique des notes les plus récentes
  - Rechargement automatique après refresh

- 🔍 Système de recherche avancé :
  - Recherche dans la note active
  - Recherche globale sur toutes les notes
  - Résultats en temps réel (live search)

- 🎯 Navigation contextuelle :
  - Un clic sur un résultat ouvre un groupe (batch) de notes
  - Conservation du contexte temporel (notes proches)

- ⌨️ Navigation clavier :
  - Ctrl + K → ouvrir la recherche
  - Flèches ↑ ↓ → naviguer dans les résultats
  - Entrée → ouvrir la note

- 🎨 Interface utilisateur inspirée des IDE (Notepad++, VS Code)

---

## 🧠 Points techniques

- **Next.js (App Router)** pour le frontend
- **Supabase** pour la base de données et l’authentification
- **Tailwind CSS** pour le design
- Gestion avancée du state (tabs, search, navigation)

---

## 💡 Concept clé

L’application ne se limite pas à une simple pagination.

Elle propose un système de **navigation contextuelle** :

- Lorsqu’un résultat de recherche est sélectionné  
- L’application affiche un ensemble de notes autour  
