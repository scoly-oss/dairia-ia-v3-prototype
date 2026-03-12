# DAIRIA IA — V3 Premium Prototype

> Le cabinet d'avocats autonome — Cockpit juridique intelligent pour la gestion du droit social en entreprise.

## 🎯 Vision

DAIRIA IA V3 est un **cockpit juridique complet** qui transforme la gestion du droit social en entreprise. Au-delà d'un simple chatbot, c'est un véritable cabinet d'avocats virtuel autonome.

## ✨ Fonctionnalités

### Dashboard — Santé Sociale
- **Score de santé sociale** temps réel de l'entreprise
- **Veille juridique personnalisée** (jurisprudence, législation, CCN)
- **Conformité sociale** avec checklist et alertes
- **Échéancier** des deadlines légales et conventionnelles

### Dossiers Juridiques
- Gestion complète de dossiers (licenciement, rupture conventionnelle, contentieux…)
- Timeline chronologique par dossier
- Liaison automatique conversations IA ↔ dossiers
- Documents rattachés et notes

### Veille & Alertes
- Alertes jurisprudence par secteur et CCN
- Suivi des évolutions législatives (JORF)
- Rappels échéances légales (entretiens pro, BDESE, NAO…)
- Notifications conformité

### Simulateur Contentieux
- Estimation des risques prud'homaux
- Barèmes Macron interactifs
- Analyse de jurisprudence similaire
- Recommandations stratégiques

### Assistant IA
- Chat juridique spécialisé droit social
- Contexte entreprise intégré (CCN, effectif, activité)
- Réponses structurées avec sources légales

## 🚀 Démarrage rapide

```bash
# Cloner le repo
git clone https://github.com/scoly-oss/dairia-ia-v3-prototype.git
cd dairia-ia-v3-prototype

# Installer les dépendances (Node 22 requis)
npm install

# Configurer l'environnement
cp .env.example .env

# Lancer en mode démo (pas besoin de backend)
npm run dev
```

Ouvrir **http://localhost:5173** — le mode démo charge des données fictives réalistes.

## 🛠 Stack technique

- **React 18** + TypeScript
- **Material UI v6** (thème custom orange/navy)
- **Vite 6** (build + HMR)
- **React Router v7**

## 📁 Structure

```
src/
├── components/        # Composants réutilisables
│   ├── Chat/          # Interface chat IA
│   ├── Navigation/    # Sidebar navigation
│   └── design-system/ # DSButton, DSCard, DSSurface
├── contexts/          # Auth, Chat, Theme, Layout
├── data/              # Mock data (mode démo)
├── pages/
│   ├── Dashboard/     # Cockpit santé sociale
│   ├── Dossiers/      # Gestion dossiers juridiques
│   ├── Alerts/        # Veille juridique & alertes
│   ├── Litigation/    # Simulateur contentieux
│   └── Calendar/      # Échéancier RH
├── services/          # API services
├── theme/             # Tokens, constantes
└── types/             # TypeScript types
```

## 🎨 Design

- **Primary** : Orange `#e8842c`
- **Secondary** : Navy `#1e2d3d`
- **Background** : Off-white `#f8f8f6`
- **Cards** : Blanc, border-radius 24px, ombre subtile
- Light mode uniquement

## 📄 Licence

Propriétaire — © 2026 DAIRIA Avocats
