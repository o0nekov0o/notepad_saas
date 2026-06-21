# 📝 Notepad SaaS (Éditeur de notes inspiré des IDE)

Application web moderne pour gérer des notes sous forme d’onglets, inspirée de Notepad++ et Visual Studio Code.

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
  - Ctrl + F → ouvrir la recherche
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
