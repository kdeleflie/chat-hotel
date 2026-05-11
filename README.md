# ChatHotel Manager 🐾

ChatHotel Manager est une application de gestion complète pour pensions félines (ou canines). Elle permet de gérer les clients, les chats, les séjours, le suivi de santé, les factures et les contrats.

## 🚀 Fonctionnalités

- **Gestion des Clients & Chats** : Base de données complète pour le suivi des propriétaires et de leurs animaux.
- **Gestion des Séjours** : Planning des arrivées et départs, attribution des boxes.
- **Suivi de Santé** : Journal quotidien (appétit, comportement, médicaments) avec alertes visuelles.
- **Facturation & Contrats** : Génération de documents PDF professionnels.
- **Sauvegarde & Restauration** : Système d'export/import complet (données et médias).
- **Interface Moderne** : Design soigné avec Tailwind CSS et animations fluides.
- **Sécurité** : Authentification via Google et règles de sécurité Firestore durcies.

## 🛠️ Stack Technique

- **Frontend** : React 18, Vite, Tailwind CSS, Lucide React (Icônes).
- **Backend** : Node.js avec Express (Proxy API).
- **Base de données & Auth** : Firebase (Firestore & Firebase Auth).
- **PDF** : jsPDF & jsPDF-AutoTable.

## 💻 Installation et Développement

### Prérequis
- Node.js (version 18 ou supérieure)
- Un projet Firebase configuré

### Installation
1. Clonez le dépôt :
   ```bash
   git clone <votre-url-github>
   cd chathotel-manager
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez vos variables d'environnement dans un fichier `.env` à la racine (voir `.env.example`).

### Lancement
Pour lancer le serveur de développement (Vite + Express) :
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

## 📜 Licence
Ce projet est privé. Tous droits réservés.
