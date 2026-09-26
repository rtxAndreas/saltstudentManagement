# Plan de réalisation — Salt Student Management

## 1. Objectif du plan

Ce document transforme le cahier des charges fonctionnel en feuille de route opérationnelle. Il tient compte de l’état actuel du projet et définit les prochaines étapes jusqu’à la validation finale.

## Statut

Le plan de développement et de validation est terminé. L’application passe les vérifications TypeScript, ESLint, Prisma, build de production et les 28 tests E2E disponibles.

## 2. État actuel

Les éléments suivants sont déjà engagés ou fonctionnels :

- authentification et gestion des utilisateurs ;
- rôles et permissions côté serveur ;
- étudiants, classes, matières et années scolaires ;
- périodes, affectations et emplois du temps ;
- notes et évaluations ;
- présences et absences ;
- examens et surveillance ;
- événements et confirmations de présence ;
- notifications ;
- portail étudiant et parent ;
- frais, factures et paiements ;
- données de test et premiers tests E2E.

## 3. Phases de réalisation

### Phase 1 — Fondations techniques

Objectif : garantir une base stable et sécurisée.

- vérifier les migrations et les relations Prisma ;
- finaliser l’authentification et les sessions ;
- vérifier les permissions des cinq rôles ;
- protéger toutes les routes et API côté serveur ;
- renforcer la validation des données reçues ;
- contrôler la gestion des erreurs.

**Livrable :** application sécurisée avec accès contrôlé selon le rôle.

### Phase 2 — Administration scolaire

Objectif : permettre à l’administration de gérer les données principales.

- gérer les utilisateurs et leurs statuts ;
- gérer les dossiers étudiants ;
- associer les parents à un ou plusieurs enfants ;
- gérer les classes et leur capacité ;
- gérer les matières et les enseignants ;
- gérer les années scolaires et les périodes ;
- gérer les inscriptions et réinscriptions.

**Livrable :** administration complète des données scolaires.

### Phase 3 — Gestion pédagogique

Objectif : assurer le suivi scolaire quotidien.

- gérer les affectations enseignant/classe/matière ;
- créer les emplois du temps ;
- détecter les conflits d’horaires, de salles et d’enseignants ;
- créer les évaluations ;
- saisir et contrôler les notes ;
- calculer les moyennes ;
- gérer les présences, absences, retards et justificatifs ;
- consulter l’historique scolaire.

**Livrable :** suivi pédagogique complet des étudiants.

### Phase 4 — Examens

Objectif : organiser les examens et leur surveillance.

- créer les sessions d’examen ;
- définir les matières, dates et horaires ;
- affecter les étudiants et les salles ;
- affecter les surveillants ;
- détecter les conflits d’étudiants, de salles et de surveillants ;
- afficher les plannings selon le rôle.

**Livrable :** module d’examens fonctionnel et contrôlé.

### Phase 5 — Espaces utilisateurs

Objectif : fournir une interface adaptée à chaque profil.

#### Enseignant

- classes et matières affectées ;
- emploi du temps ;
- notes et évaluations ;
- appel et absences ;
- notifications.

#### Étudiant

- profil scolaire ;
- emploi du temps ;
- notes et moyennes ;
- examens ;
- absences ;
- événements et notifications.

#### Parent

- sélection d’un enfant ;
- notes et absences ;
- emploi du temps ;
- examens ;
- événements ;
- informations financières.

**Livrable :** espaces personnalisés et sécurisés.

### Phase 6 — Communication et événements

Objectif : faciliter les échanges entre l’établissement et les familles.

- créer des événements scolaires ;
- cibler les destinataires par classe, rôle ou établissement ;
- gérer les confirmations de présence ;
- publier des annonces ;
- générer et consulter les notifications ;
- marquer les notifications comme lues.

**Livrable :** système de communication intégré.

### Phase 7 — Finance et paiements

Objectif : assurer le suivi des frais scolaires.

- définir les frais ;
- créer les factures ;
- associer les factures aux étudiants ;
- enregistrer les paiements ;
- calculer les soldes ;
- produire les reçus ;
- limiter l’accès aux données financières ;
- empêcher les paiements supérieurs au solde.

**Livrable :** gestion financière fiable et sécurisée.

### Phase 8 — Tableaux de bord et rapports

Objectif : fournir une vision synthétique de l’établissement.

- afficher les statistiques d’étudiants, classes et enseignants ;
- suivre les absences ;
- suivre les paiements ;
- afficher les prochaines évaluations et examens ;
- afficher les événements à venir ;
- produire des rapports par classe, période et année scolaire ;
- ajouter les exports PDF/CSV si nécessaire.

**Livrable :** tableaux de bord et rapports exploitables.

### Phase 9 — Qualité et expérience utilisateur

Objectif : rendre l’application claire, responsive et fiable.

- finaliser les états de chargement ;
- finaliser les messages d’erreur ;
- gérer les listes vides ;
- améliorer l’affichage mobile et tablette ;
- ajouter les confirmations avant les opérations sensibles ;
- vérifier l’accessibilité ;
- contrôler toutes les permissions et règles métier.

**Livrable :** interface stable et utilisable sur ordinateur, tablette et mobile.

### Phase 10 — Tests et livraison

Objectif : valider l’application avant sa mise en production.

- tests unitaires ciblés ;
- tests des API ;
- tests des permissions ;
- tests des règles métier ;
- tests E2E des parcours administrateur, enseignant, étudiant, parent et comptable ;
- vérification TypeScript, ESLint et Prisma ;
- correction des anomalies ;
- mise à jour de la documentation ;
- préparation du déploiement et des sauvegardes.

**Livrable :** version validée et prête à être déployée.

## 4. Priorités immédiates

1. Ajouter les tests d’autorisation liés aux présences.
2. Vérifier les contrôles d’accès dans les notes, examens, paiements et événements.
3. Corriger les derniers problèmes UX, erreurs et états vides.
4. Compléter les tests E2E des parcours prioritaires.
5. Effectuer la validation complète avant le déploiement.

## 5. Critères de validation finale

Le projet sera considéré comme prêt lorsque :

- chaque rôle peut réaliser son parcours principal ;
- chaque accès interdit est bloqué côté serveur ;
- les données d’un étudiant ne sont pas accessibles à un utilisateur non autorisé ;
- les règles métier principales sont testées ;
- les tests TypeScript, lint, Prisma et E2E sont passants ;
- les écrans principaux fonctionnent sur mobile et ordinateur ;
- les erreurs et listes vides sont clairement présentées ;
- la documentation est à jour ;
- la sauvegarde et le déploiement sont préparés.
