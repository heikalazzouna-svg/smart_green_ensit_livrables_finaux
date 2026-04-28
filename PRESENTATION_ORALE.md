# 🎤 SCRIPT DE PRÉSENTATION ORALE : SMART GREEN ENSIT

> [!TIP]
> **Durée cible : 5 à 10 minutes**
> Ce document est conçu comme un "pitch" complet. Vous pouvez le lire tel quel ou vous en inspirer pour vos slides. Prenez un ton confiant et professionnel.

---

## 1. 🌟 SYNTHÈSE DU PROJET (1 minute 30)

**[Introduction]**
"Bonjour à tous les membres du jury. Aujourd'hui, nous vous présentons **SMART GREEN ENSIT**, notre plateforme intelligente de pilotage de l'empreinte carbone pour notre école.

**[Le Constat]**
Nous sommes partis d'un constat simple : la transition écologique des campus universitaires ne peut pas se piloter avec de simples fichiers Excel désorganisés. Il faut de la structure, de la visibilité et surtout, de l'anticipation.

**[La Solution]**
Nous avons donc développé une solution *Full-Stack* de bout-en-bout. SMART GREEN ENSIT n'est pas juste un calculateur ; c'est un véritable Système d'Information environnemental. Il permet :
1. De collecter facilement les données de consommation et de mobilité.
2. De calculer automatiquement le bilan carbone complet de l'école.
3. D'offrir aux décideurs un tableau de bord clair.
4. Et d'utiliser l'Intelligence Artificielle pour simuler et prédire nos futures émissions."

---

## 2. 🛠️ CHOIX TECHNIQUES ET MÉTHODOLOGIQUES (2 minutes)

**[La Méthodologie Carbone]**
"Avant de coder, nous avons rigoureusement respecté les standards internationaux du **GHG Protocol**. Notre modèle mathématique répartit automatiquement les émissions sur les Scopes 1, 2 et 3.
L'une de nos plus grandes fiertés méthodologiques est l'utilisation de données locales. Au lieu de copier des calculateurs européens, notre système intègre le facteur d'émission réel du mix énergétique tunisien fourni par la STEG *(0.656 kgCO2e/kWh)*, ce qui rend notre Bilan Carbone précis et authentique.

**[Les Choix Technologiques]**
Côté technique, l'application est pensée pour la production :
- **Le Backend** est en **Python (FastAPI)**, ce qui nous a permis d'intégrer nativement nos algorithmes d'Intelligence Artificielle (*Scikit-Learn*).
- **Le Frontend** est en **React** pour offrir une expérience utilisateur (UX) ultra-fluide et sans rechargement.
- **Les Données** sont sécurisées dans une base **PostgreSQL** robuste.
- Enfin, toute l'architecture est conteneurisée via **Docker**. Cela signifie que l'application peut être déployée ce soir sur les serveurs de l'école avec une seule ligne de commande."

---

## 3. 💻 DÉMONSTRATION DU PROTOTYPE (3 minutes 30)

*(Conseil : Passez sur l'écran de l'application. Ne parlez pas, montrez !)*

**Action 1 : Le Tableau de Bord (Le constat)**
> *"Voici l'écran d'accueil du directeur. En un coup d'œil, il voit que l'ENSIT a émis environ 547 tonnes de CO2. Remarquez le graphique d'évolution temporelle qui sépare clairement les Scopes, et le classement qui montre instantanément quel bâtiment consomme le plus."*

**Action 2 : La Saisie de Données (L'interactivité)**
*(Allez dans 'Saisie de Données' > 'Enquête de Mobilité')*
> *"Une application carbone sans données ne sert à rien. Nous avons intégré un module où un étudiant peut déclarer venir en voiture 5 jours par semaine. En arrière-plan, notre algorithme convertit immédiatement ces habitudes de vie en données d'impact environnemental (Scope 3)."*

**Action 3 : L'Évolutivité (L'administration)**
*(Allez dans 'Administration' > 'Entités' et ajoutez un bâtiment factice 'Nouveau Labo')*
> *"L'application n'est pas figée. Si l'ENSIT construit un nouveau bâtiment, un administrateur l'ajoute ici en deux clics. Pas besoin de redemander aux développeurs de modifier le code."*

**Action 4 : Le "Climax" - L'IA et la Simulation**
*(Allez dans 'Simulation et IA')*
> *"C'est ici que SMART GREEN ENSIT prend toute sa valeur stratégique. Nous avons développé un simulateur. Regardez : si nous simulons une réduction de 20% de l'électricité sur le bâtiment principal, le système compare instantanément la 'Baseline' avec notre 'Scénario'. 
> Enfin, grâce à notre modèle d'apprentissage automatique (Gradient Boosting), l'application analyse notre historique et trace en vert la prédiction de nos futures consommations pour les 12 prochains mois."*

---

## 4. 🚀 PERSPECTIVES ET CONCLUSION (1 minute)

**[Perspectives]**
"Pour conclure, ce prototype est prêt, mais nous voyons déjà plus loin. Pour les prochaines étapes, l'architecture que nous avons construite permettrait d'intégrer :
1. **L'Internet des Objets (IoT)** : Connecter notre API directement à des compteurs intelligents STEG pour remonter la donnée en temps réel.
2. **Le cycle de vie (ACV)** : Étendre le Scope 3 pour y inclure le poids carbone de la construction des futurs bâtiments du campus.

**[Clôture]**
Avec SMART GREEN ENSIT, nous voulions prouver qu'avec une ingénierie logicielle solide et des algorithmes adaptés, nous pouvions donner à notre école l'outil décisionnel dont elle a besoin pour réussir sa transition écologique.

Merci de votre attention. Nous sommes à votre disposition pour vos questions et pour vous montrer le code."
