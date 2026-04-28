# 🌱 SMART GREEN ENSIT

> [!NOTE]
> **Plateforme intelligente de pilotage de l'empreinte carbone pour l'École Nationale Supérieure d'Ingénieurs de Tunis (ENSIT).** 
> 
> Cette solution complète permet de collecter les données énergétiques, de calculer automatiquement le Bilan Carbone (Scopes 1, 2 et 3), de visualiser les résultats et de simuler des scénarios de réduction grâce à l'Intelligence Artificielle.

---

## 📁 1. STRUCTURE DU CODE SOURCE

L'architecture du projet est divisée en deux parties principales (monorepo) pour séparer l'interface client de la logique serveur :

```text
smart-green-ensit/
├── backend/                  # ⚙️ API RESTful (Python / FastAPI)
│   ├── app/
│   │   ├── api/              # Contrôleurs : auth, dashboard, data, calculations, simulations, admin
│   │   ├── core/             # Configuration, Sécurité JWT, Facteurs d'émission par défaut
│   │   ├── db/               # Connexion SQLAlchemy et gestion des sessions
│   │   ├── models/           # Modèles de base de données (PostgreSQL)
│   │   ├── schemas/          # Schémas de validation Pydantic (Types)
│   │   ├── main.py           # Point d'entrée de l'application FastAPI
│   │   └── seed.py           # Script d'auto-remplissage de la base de données
│   ├── requirements.txt      # Dépendances Python
│   └── Dockerfile            # Instructions de build Docker (Backend)
│
├── frontend/                 # 💻 Interface Utilisateur (React / Vite)
│   ├── src/
│   │   ├── api/              # Configuration du client HTTP Axios
│   │   ├── components/       # Composants UI réutilisables (KpiCard, EmissionsChart, etc.)
│   │   ├── pages/            # Vues principales (Dashboard, DataEntry, Simulation, Admin)
│   │   ├── App.tsx           # Routage React Router
│   │   └── main.tsx          # Point d'entrée React
│   ├── package.json          # Dépendances Node.js
│   ├── nginx.conf            # Configuration du reverse proxy pour la production
│   └── Dockerfile.dev        # Instructions de build Docker (Frontend)
│
└── docker-compose.yml        # 🐳 Orchestration des 5 conteneurs
```

---

## 🚀 2. INSTALLATION ET DÉPLOIEMENT

> [!IMPORTANT]
> La solution est **entièrement conteneurisée**. Vous n'avez pas besoin d'installer Python, Node.js ou PostgreSQL sur votre machine. Docker s'occupe de tout.

### Prérequis
*   [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/) installés.
*   Environnement Linux, macOS, ou Windows avec WSL 2.

### Lancement de l'application (Démarrage rapide)
Ouvrez un terminal à la racine du projet (`smart-green-ensit/`) et exécutez la commande suivante :

```bash
docker compose up -d --build
```

Docker va télécharger les images, compiler le code, et lancer les 5 conteneurs.
Lors du premier lancement, le script backend va **pré-remplir la base de données** avec des facteurs d'émission, des bâtiments (entités) et 24 mois d'historique de consommation pour générer des graphiques immédiatement.

### Accès aux services
Une fois les conteneurs démarrés, vos services sont disponibles :

| Service | URL locale |
| :--- | :--- |
| **Application Web (UI)** | [http://localhost:3000](http://localhost:3000) |
| **Documentation de l'API (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **Administration Base de Données (pgAdmin)** | [http://localhost:5050](http://localhost:5050) |

### 🔑 Comptes de démonstration pré-configurés
*   **Administrateur** : `admin@ensit.tn` (Mot de passe: `Admin@2026`) - Accès total
*   **Utilisateur** : `user@ensit.tn` (Mot de passe: `User@2026`) - Accès standard

---

## 🛠️ 3. COMPRÉHENSION ET ÉVOLUTION DU CODE

L'application a été conçue pour être hautement modulaire. Voici comment la faire évoluer :

> [!TIP]
> **Comment ajouter une nouvelle source d'émission ?**
> Connectez-vous en tant qu'Administrateur, naviguez vers l'onglet **Administration > Sources d'émission**, et ajoutez votre nouvelle source. Elle sera immédiatement disponible dans les formulaires de saisie.
> *Techniquement* : Vous pouvez aussi les coder en dur dans `backend/app/core/emission_factors.py`.

> [!TIP]
> **Comment modifier la logique de calcul du bilan carbone ?**
> La logique mathématique se trouve dans le fichier `backend/app/api/calculations.py`. C'est là que les quantités sont multipliées par les facteurs d'émission (`activity.quantity * source.factor_kgco2e`).

> [!TIP]
> **Comment faire évoluer le modèle d'Intelligence Artificielle ?**
> Le modèle de prédiction énergétique se trouve dans `backend/app/api/simulations.py` (route `/predictions/energy`). 
> Il utilise actuellement un algorithme `GradientBoostingRegressor` (Scikit-learn). Pour le remplacer par un réseau de neurones LSTM ou par Prophet, il suffit d'injecter votre nouveau modèle dans cette fonction spécifique sans perturber le reste de l'API.

---

## 📜 4. TECHNOLOGIES UTILISÉES
- **Frontend** : React 19, TypeScript, TailwindCSS, Recharts.
- **Backend** : Python 3.11, FastAPI, SQLAlchemy, Pydantic, Scikit-learn.
- **Infrastructure** : PostgreSQL, Nginx, Docker.
