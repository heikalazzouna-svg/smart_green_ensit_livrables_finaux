# 📝 NOTE EXPLICATIVE (MÉTHODOLOGIQUE)

> [!NOTE]
> Ce document précise la démarche mathématique, les hypothèses adoptées et les limites de la solution logicielle **SMART GREEN ENSIT** pour le calcul du Bilan Carbone.

---

## 1. 🧮 LA DÉMARCHE DE CALCUL DU BILAN CARBONE

La méthodologie adoptée par la plateforme s'aligne rigoureusement sur les standards internationaux du **GHG Protocol** et de la méthode **Bilan Carbone®** (ADEME).

La formule fondamentale appliquée par le moteur de calcul (Backend) est la suivante :

```math
Émissions (kgCO_2e) = Donnée\ d'Activité \times Facteur\ d'Émission
```

> [!TIP]
> Afin d'être lisibles sur le tableau de bord, les émissions sont systématiquement divisées par 1000 pour être exprimées en **Tonnes d'équivalent CO2 (tCO2e)**, l'unité standard des rapports climatiques.

Pour garantir une comptabilité carbone exhaustive, le logiciel segmente et étiquette automatiquement les calculs en trois périmètres réglementaires :

- 🔴 **Scope 1 (Émissions directes)** : Calculé à partir des combustions fossiles ayant lieu *sur le campus* (ex: combustion de gaz naturel pour le chauffage) et des fuites de fluides frigorigènes des climatiseurs.
- 🟡 **Scope 2 (Émissions indirectes liées à l'énergie)** : Calculé à partir de la consommation électrique globale du campus (kWh).
- 🔵 **Scope 3 (Autres émissions indirectes)** : Principalement axé sur la mobilité étudiante. Le système applique la formule complexe suivante en arrière-plan lors des enquêtes de mobilité :
  *`Distance unitaire (km) × 2 (aller-retour) × Trajets par semaine × Facteur du mode de transport`*

---

## 2. 🌍 SOURCES DE DONNÉES ET FACTEURS D'ÉMISSION

Pour assurer la crédibilité scientifique des calculs, l'application est pré-configurée avec des facteurs d'émission officiels. 

> [!IMPORTANT]
> Contrairement aux applications européennes utilisant le mix énergétique français (très nucléarisé et décarboné), **SMART GREEN ENSIT utilise le facteur spécifique de la STEG (Tunisie)**.

| Catégorie | Source | Facteur d'Émission | Référentiel / Justification |
| :--- | :--- | :--- | :--- |
| **Électricité** | Réseau STEG | `0.656 kgCO2e/kWh` | Spécifique au mix énergétique tunisien (fortement dépendant du gaz naturel). |
| **Gaz Naturel** | Chauffage | `0.227 kgCO2e/kWh` | Base Carbone ADEME (Combustion standard). |
| **Mobilité** | Voiture thermique | `0.193 kgCO2e/km` | Base Carbone ADEME (Moyenne par passager). |
| **Climatisation**| Fuite R-410A | `2088 kgCO2e/kg` | Rapports du GIEC (Pouvoir de Réchauffement Global extrême des gaz réfrigérants). |

L'architecture est évolutive : les administrateurs peuvent mettre à jour ces valeurs directement depuis l'interface si l'Agence Nationale pour la Maîtrise de l'Énergie (ANME) publie de nouveaux coefficients officiels.

---

## 3. ✂️ HYPOTHÈSES ET SIMPLIFICATIONS ADOPTÉES

Afin de rendre le prototype fonctionnel dans les délais du challenge, plusieurs hypothèses de conception ont été posées :

1. **Périmètre organisationnel** : L'analyse est restreinte aux limites physiques du campus de l'ENSIT (Bâtiments, Laboratoires, Administration). Les émissions lointaines (déplacements internationaux pour des séminaires, consommation énergétique des étudiants en télétravail) sont exclues de cette version v1.0.
2. **Lissage de la mobilité** : Lors de l'acquisition des données d'enquête, le système suppose que le comportement de transport déclaré (ex: "je viens 4 fois par semaine en voiture") est constant tout au long du mois, sans prendre en compte les jours fériés ou les absences maladies.
3. **Périmètre du Scope 3** : Le Scope 3 implémenté se concentre sur les déplacements (le poste le plus significatif pour une école). L'Analyse du Cycle de Vie (ACV) des matériaux de construction initiaux du campus n'est pas amortie dans ce calcul.

---

## 4. 🚧 LES LIMITES DE LA SOLUTION

> [!WARNING]
> En tant que solution orientée données, la pertinence des résultats dépend de la qualité des entrants.

- **Biais déclaratif du Scope 3** : La précision des émissions liées à la mobilité dépend entièrement du taux de participation des étudiants aux enquêtes. Une faible participation nécessiterait des extrapolations statistiques qui réduiraient la marge de confiance du bilan.
- **Limites de la Prédiction IA (Cold Start)** : Le module prédictif d'Intelligence Artificielle (*Gradient Boosting*) nécessite un historique minimum d'une année (12 mois) d'activités pour "comprendre" la saisonnalité (pics de climatisation en été, chauffage en hiver). En deçà de ce seuil, le système utilise un algorithme de *Lissage Exponentiel (EMA)*, qui est robuste mais incapable de prédire les variations saisonnières complexes.
