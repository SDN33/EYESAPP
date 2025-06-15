# Eyes - Life Is Precious

_Eyes - Life Is Precious_ est une application mobile développée par **Still-inov Agency** ([stillinov.com](https://stillinov.com)), spécialisée dans l’innovation digitale et la mobilité connectée.

Eyes est dédiée à la sécurité et à la communauté des conducteurs de deux-roues et d’automobilistes. Elle propose des fonctionnalités avancées de détection, d’alertes, de navigation, de tutoriel interactif et d’intégration communautaire.

## Sommaire
- [Fonctionnalités principales](#fonctionnalités-principales)
- [Installation & Lancement](#installation--lancement)
- [Mode d’emploi](#mode-demploi)
- [Architecture & Structure](#architecture--structure)
- [APIs & Services utilisés](#apis--services-utilisés)
- [Sécurité & Confidentialité](#sécurité--confidentialité)
- [Audit technique](#audit-technique)
- [Contact & Support](#contact--support)

---

## Fonctionnalités principales
- **Détection d’utilisateurs proches** (People Nearby) : géolocalisation en temps réel, filtrage par mode (moto/auto), affichage sur carte, notifications de proximité.
- **Modes de conduite** : sélection dynamique (2 roues / auto), interface et alertes adaptées, onboarding tutoriel animé.
- **Navigation & Trafic** : carte immersive, calcul d’itinéraire, alertes trafic, affichage de la vitesse et de l’angle d’inclinaison.
- **Bouton SOS** : accessible en permanence, appel d’urgence rapide (112), design cohérent sur tous les écrans.
- **Communauté** : fil d’actualité, posts, intégration du logo, accès aux mises à jour et à l’entraide.
- **Accessibilité & Design** : interface moderne, responsive, couleurs adaptées, tutoriel accessible à chaque démarrage.

---

## Installation & Lancement

### Prérequis
- Node.js >= 18
- Yarn (ou npm)
- Expo CLI (`npm install -g expo-cli`)
- Accès à un émulateur ou un appareil physique (iOS/Android)

### Installation
```bash
yarn install
# ou
npm install
```

### Lancement
```bash
expo start
```

---

## Mode d’emploi

1. **Première ouverture** : un tutoriel animé vous guide pour choisir votre mode (2 roues ou auto).
2. **Navigation** : accédez à la carte, visualisez votre position, les usagers proches et les alertes.
3. **Changer de mode** : utilisez le switch en haut à droite ou repassez par le tutoriel (affiché à chaque démarrage).
4. **Bouton SOS** : accessible en haut à gauche, permet d’appeler rapidement les secours.
5. **Communauté** : consultez les actualités, posts et entraidez-vous avec d’autres utilisateurs.

---

## Architecture & Structure

- `app/` : Entrée principale, navigation, écrans (Explore, Communauté, etc.)
- `components/` : Composants UI réutilisables (MapView, ModeTutorial, Alertes, etc.)
- `hooks/` : Hooks personnalisés (géolocalisation, mode, consentement, etc.)
- `services/` : Intégration API (Supabase, Sanity, etc.)
- `constants/` : Couleurs, configuration, événements analytiques
- `utils/` : Fonctions utilitaires (formatage, calculs géo, etc.)
- `assets/` : Images, logos, polices

---

## APIs & Services utilisés

- **Supabase** : Authentification, stockage des utilisateurs, géolocalisation, requêtes PostGIS pour la détection de proximité.
- **Sanity** : CMS headless pour la gestion des posts et de la communauté.
- **OpenStreetMap** : Récupération des limites de vitesse et informations routières.
- **Google Directions API** : Calcul d’itinéraires et détection du trafic (clé à configurer dans `app.json`).
- **Expo** : Accès capteurs, gestion du build, notifications, assets.
- **AsyncStorage** : Persistance locale (mode, consentement, tutoriel vu, etc.)

---

## Sécurité & Confidentialité
- Les données de localisation sont utilisées uniquement pour les fonctionnalités de l’app et ne sont jamais revendues.
- L’utilisateur peut retirer son consentement à tout moment.
- Les appels d’urgence (SOS) sont directs et ne transitent pas par un serveur tiers.

---

## Audit technique

### Points forts
- **Séparation claire des responsabilités** (hooks, composants, services)
- **Gestion robuste du mode** (propagation, filtrage, onboarding)
- **UI cohérente et accessible** (bouton SOS, tutoriel, overlays)
- **Détection des usagers proches fiable** (filtrage par id, mode, sans doublon)
- **Code commenté et structuré**

### Points à surveiller / Suggestions
- **Sécurité API** : veillez à ne pas exposer de clés sensibles dans le repo ou le client.
- **Tests** : renforcer la couverture de tests unitaires et d’intégration (dossier `tests/`).
- **Performance** : surveiller la consommation batterie liée à la géolocalisation en temps réel.
- **Accessibilité** : continuer à améliorer le contraste et la navigation clavier/lecteur d’écran.


---

## Contact & Support
Pour toute question, bug ou suggestion :
- Email : contact@stillinov.com
- Site agence : [stillinov.com](https://stillinov.com)
- Documentation technique : voir les fichiers `README.md`, `docs/` et les commentaires dans le code.

---

© 2025 Eyes - Life Is Precious / Still-inov Agency. Tous droits réservés.
