# Cahier des charges fonctionnel

## 1. Présentation du projet

### 1.1 Nom du projet

**Salt Student Management**

### 1.2 Objectif

Mettre en place une plateforme web de gestion scolaire permettant à l’établissement de centraliser les informations administratives et pédagogiques, tout en offrant un espace adapté à chaque utilisateur : administration, enseignant, étudiant, parent et comptable.

### 1.3 Objectifs principaux

- Centraliser les dossiers des étudiants.
- Organiser les classes, cours, enseignants et emplois du temps.
- Suivre les notes, évaluations, examens et absences.
- Permettre aux étudiants et aux parents de consulter les informations scolaires.
- Faciliter la communication entre l’établissement et les familles.
- Suivre les frais scolaires, factures et paiements.
- Sécuriser l’accès aux données selon le rôle de l’utilisateur.

## 2. Utilisateurs et droits

### 2.1 Super-administrateur

Le super-administrateur est le rôle de plus haut niveau. Il dispose de tous les droits de l’administrateur et, en plus :

- administrer les autres administrateurs ;
- contrôler le statut des comptes de niveau administratif ;
- être le seul à pouvoir désactiver ou supprimer un compte administrateur ;
- prévention de l’auto-suppression de son propre compte.

### 2.2 Administrateur

L’administrateur gère l’établissement et dispose des droits suivants :

- gérer les utilisateurs et leurs rôles ;
- créer, modifier et désactiver les comptes ;
- gérer les étudiants, parents, classes et enseignants ;
- gérer les années scolaires, périodes et matières ;
- créer les affectations enseignant/classe/matière ;
- gérer les salles, emplois du temps et examens ;
- publier des événements et communications ;
- consulter les statistiques et rapports ;
- superviser les absences, notes, paiements et notifications.

### 2.3 Enseignant

L’enseignant peut consulter et gérer uniquement les données liées à ses affectations :

- consulter ses classes et matières ;
- consulter son emploi du temps ;
- consulter la liste des étudiants de ses classes ;
- saisir et modifier les notes autorisées ;
- créer ou consulter les évaluations ;
- effectuer l’appel et enregistrer les absences ;
- consulter les examens et ses tâches de surveillance ;
- recevoir les notifications de l’établissement.

L’enseignant ne peut pas gérer les comptes utilisateurs, les paiements ou les paramètres administratifs.

### 2.4 Étudiant

L’étudiant dispose d’un espace personnel lui permettant de :

- consulter son profil et son dossier scolaire ;
- consulter sa classe, ses matières et son emploi du temps ;
- consulter ses notes, moyennes et évaluations ;
- consulter les examens, salles et horaires ;
- consulter son historique de présence ;
- consulter les annonces et événements ;
- confirmer sa présence à un événement lorsque cela est demandé ;
- consulter les informations financières qui lui sont destinées ;
- recevoir des notifications.

L’étudiant ne peut modifier ni ses notes, ni ses absences, ni les données administratives de l’établissement.

### 2.5 Parent

Le parent dispose d’un espace familial permettant de :

- consulter un ou plusieurs enfants liés à son compte ;
- consulter la classe, les cours et l’emploi du temps de chaque enfant ;
- consulter les notes, moyennes et évaluations ;
- consulter les absences et retards ;
- consulter les examens et événements scolaires ;
- confirmer la participation à une réunion ou un événement ;
- consulter les frais scolaires, factures et paiements ;
- recevoir les notifications importantes de l’établissement.

Le parent ne peut consulter que les enfants qui lui sont effectivement associés.

### 2.6 Comptable

Le comptable peut :

- gérer les frais scolaires ;
- créer et consulter les factures ;
- enregistrer les paiements ;
- consulter les soldes et reçus ;
- produire les rapports financiers nécessaires.

Le comptable ne peut pas modifier les notes, les absences ou les comptes administratifs.

## 3. Modules fonctionnels

### 3.1 Authentification et comptes

- connexion et déconnexion sécurisées ;
- contrôle du statut actif/inactif du compte ;
- redirection selon le rôle ;
- protection des routes et des API ;
- gestion des mots de passe ;
- prévention de l’auto-suppression d’un administrateur ;
- affichage des actions uniquement lorsque l’utilisateur y est autorisé.

### 3.2 Gestion des utilisateurs

- création d’un compte administrateur, enseignant, étudiant, parent ou comptable ;
- modification des informations personnelles ;
- association d’un compte étudiant à un dossier étudiant ;
- association d’un parent à un ou plusieurs enfants ;
- activation et désactivation des comptes ;
- recherche par nom, email ou rôle ;
- validation des emails uniques et des mots de passe.

### 3.3 Gestion des étudiants

- création du dossier étudiant ;
- numéro d’inscription unique ;
- informations personnelles et coordonnées ;
- affectation à une classe et à une année scolaire ;
- changement de classe ou réinscription ;
- consultation de l’historique scolaire ;
- recherche et filtrage des étudiants ;
- export ou impression du dossier selon les droits.

### 3.4 Gestion des classes, matières et enseignants

- création et modification des classes ;
- définition du niveau et de la capacité ;
- création des matières/cours ;
- affectation d’un enseignant à une matière et une classe ;
- contrôle des doublons d’affectation ;
- consultation des étudiants inscrits ;
- filtrage et pagination des listes.

### 3.5 Années scolaires et périodes

- création d’une année scolaire ;
- définition des dates de début et de fin ;
- activation d’une seule année scolaire courante ;
- création des périodes ou semestres ;
- contrôle de la cohérence des dates ;
- association des notes, inscriptions et emplois du temps à la bonne période.

### 3.6 Emploi du temps

- création d’un créneau de cours ;
- association à une classe, une matière, un enseignant et une salle ;
- affichage par jour, classe ou enseignant ;
- détection des conflits horaires ;
- détection des conflits de salle ;
- consultation par rôle : chaque utilisateur ne voit que l’emploi du temps qui le concerne ;
- l’enseignant ne voit que les cours de ses affectations ;
- l’étudiant ne voit que les cours de sa classe ;
- le parent ne voit que les emplois du temps des enfants qui lui sont liés.

### 3.7 Notes et évaluations

- création d’une évaluation ;
- définition du barème et du coefficient ;
- saisie des notes par l’enseignant autorisé ;
- contrôle du score maximal ;
- calcul des moyennes ;
- consultation par période et par matière ;
- notification de la publication d’une note ;
- conservation de l’historique des modifications si nécessaire.

### 3.8 Présences et absences

- appel par cours et par date ;
- statuts : présent, absent, retard, excusé ;
- ajout d’un motif ;
- modification d’une présence existante ;
- contrôle de l’appartenance de l’étudiant à la classe du cours ;
- contrôle de l’autorisation de l’enseignant ;
- consultation de l’historique par l’étudiant et le parent ;
- notification à la famille en cas d’absence importante.

### 3.9 Examens

- création d’une session d’examen ;
- définition des matières, dates et créneaux ;
- affectation des classes et étudiants ;
- réservation des salles ;
- affectation des surveillants ;
- détection des conflits de salle, étudiant et surveillant ;
- consultation des horaires et salles par l’étudiant et le parent.

### 3.10 Événements et communication

- création de conférences, réunions de parents et événements scolaires ;
- ciblage de toute l’école, d’une classe ou d’un rôle ;
- définition de la date, du lieu et de la description ;
- demande de confirmation de présence ;
- gestion des réponses RSVP ;
- création automatique de notifications ;
- consultation des événements à venir.

### 3.11 Finance et paiements

- définition des frais scolaires ;
- création des factures ;
- association d’une facture à un étudiant ;
- enregistrement des paiements ;
- calcul du solde restant ;
- interdiction d’un paiement supérieur au solde ;
- consultation des reçus ;
- consultation limitée au parent, à l’étudiant concerné et au comptable autorisé.

### 3.12 Notifications

- notifications de nouvelles notes ;
- notifications d’absences ;
- notifications d’événements ;
- notifications liées aux paiements ;
- affichage des notifications non lues ;
- marquage comme lu ;
- ciblage par utilisateur, classe ou rôle.

### 3.13 Tableau de bord et rapports

- nombre d’étudiants, classes et enseignants ;
- statistiques de présence ;
- état des paiements ;
- prochaines évaluations et examens ;
- événements à venir ;
- rapports par classe, période ou année scolaire ;
- export PDF/CSV lorsque le besoin est validé.

### 3.14 Bulletins et rapports

- génération d’une bulletin par étudiant, classe et période ;
- calcul des moyennes par matière, normalisées sur 20 et pondérées par coefficient ;
- calcul de la moyenne générale ;
- calcul du rang et de la taille de la classe ;
- calcul de la moyenne de classe ;
- saisie et modification de l’appréciation par l’administrateur autorisé ;
- statuts : brouillon, validé ;
- validation par l’administrateur avec cachet de validation (nom, date) ;
- notification automatique à la famille et à l’étudiant lors de la validation ;
- génération ou validation des bulletins pour toute une classe en une opération ;
- consultation par l’étudiant et le parent dans l’espace familial ;
- édition imprimable d’un bulletin individuel ;
- accès restreint : seuls l’administrateur, l’enseignant de la classe, l’étudiant concerné et le parent lié y accèdent ;
- les bulletins non validés restent internes et invisibles pour l’étudiant et le parent.

## 4. Règles métier principales

- Un utilisateur ne peut accéder qu’aux données autorisées par son rôle.
- Un étudiant ne peut appartenir qu’à une classe active dans un contexte scolaire donné.
- Un parent ne voit que les étudiants qui lui sont liés.
- Un enseignant ne peut saisir une note ou une présence que pour une affectation qui lui appartient.
- Une présence doit correspondre à la classe du créneau sélectionné.
- Une note ne peut pas dépasser le score maximal de l’évaluation.
- Une date de fin doit être postérieure à une date de début.
- Une année scolaire active doit être cohérente avec les inscriptions et les périodes.
- Une salle, un enseignant ou un étudiant ne doit pas être affecté à deux activités incompatibles au même moment.
- Les paiements ne peuvent pas dépasser le solde restant.
- Les emails et numéros d’inscription doivent être uniques lorsque le modèle l’exige.
- Les suppressions sensibles doivent demander une confirmation et respecter les dépendances existantes.

## 5. Exigences non fonctionnelles

### Sécurité

- authentification obligatoire pour les espaces privés ;
- autorisation vérifiée côté serveur, et pas uniquement dans l’interface ;
- validation des données reçues par les API ;
- protection contre l’accès aux dossiers d’autres étudiants ;
- mots de passe stockés de manière sécurisée ;
- journalisation des erreurs importantes.

### Ergonomie

- interface responsive ordinateur, tablette et mobile ;
- navigation adaptée au rôle ;
- libellés et messages en français ;
- états de chargement, erreurs et listes vides ;
- recherche, filtres et pagination sur les listes volumineuses ;
- confirmations avant les opérations sensibles.

### Performance et fiabilité

- requêtes limitées aux données nécessaires ;
- pagination côté serveur lorsque le volume l’exige ;
- opérations critiques réalisées de manière transactionnelle ;
- gestion explicite des erreurs réseau et base de données ;
- sauvegarde régulière de la base de données en production.

## 6. Plan de réalisation

### Phase 1 — Fondations

- modèles de données ;
- authentification ;
- rôles et permissions ;
- utilisateurs et étudiants ;
- classes, matières et années scolaires.

### Phase 2 — Gestion pédagogique

- affectations ;
- emplois du temps ;
- notes et évaluations ;
- examens ;
- présences.

### Phase 3 — Espaces utilisateurs

- espace enseignant ;
- espace étudiant ;
- espace parent ;
- notifications ;
- événements et confirmations.

### Phase 4 — Gestion financière

- frais ;
- factures ;
- paiements ;
- reçus ;
- rapports comptables.

### Phase 5 — Qualité et livraison

- validation des règles métier ;
- tests unitaires ciblés ;
- tests d’intégration API ;
- tests E2E de tous les parcours ;
- correction des erreurs ;
- vérification responsive et accessibilité ;
- documentation et préparation du déploiement.

## 7. Scénarios utilisateurs prioritaires

### Étudiant

1. Se connecter.
2. Consulter son tableau de bord.
3. Consulter son emploi du temps.
4. Consulter ses notes et moyennes.
5. Consulter ses examens.
6. Consulter ses absences.
7. Lire une notification ou confirmer un événement.

### Enseignant

1. Se connecter.
2. Consulter ses classes et affectations.
3. Consulter son emploi du temps.
4. Saisir une évaluation et les notes.
5. Effectuer l’appel.
6. Consulter les événements et notifications.
7. Vérifier qu’il ne peut pas accéder aux fonctions administratives interdites.

### Parent

1. Se connecter.
2. Sélectionner un enfant lorsque plusieurs enfants sont liés.
3. Consulter les notes et absences.
4. Consulter l’emploi du temps et les examens.
5. Consulter les événements et répondre à une invitation.
6. Consulter les frais, factures et paiements.
7. Vérifier qu’aucune donnée d’un autre étudiant n’est visible.

### Administration

1. Créer une année scolaire et une classe.
2. Créer les comptes et dossiers utilisateurs.
3. Inscrire les étudiants.
4. Affecter les enseignants et les matières.
5. Construire l’emploi du temps.
6. Publier un événement.
7. Suivre les notes, absences et statistiques.
8. Contrôler les règles d’accès.

## 8. Critères de validation finale

Le projet sera considéré comme fonctionnel lorsque :

- chaque rôle peut réaliser ses parcours principaux ;
- chaque accès interdit est bloqué côté serveur ;
- les règles métier principales sont validées ;
- les données d’un étudiant ne sont jamais exposées à un autre utilisateur non autorisé ;
- les parcours étudiant, enseignant et parent sont couverts par les tests ;
- les tests TypeScript, lint, Prisma et E2E sont passants ;
- les écrans principaux sont utilisables sur mobile et ordinateur ;
- les erreurs et états vides sont présentés clairement ;
- la documentation technique et fonctionnelle est à jour.

## 9. État actuel

Les fondations, la majorité des modules pédagogiques, les espaces étudiant/parent, les événements, les présences, les examens, les évaluations, les notifications et la finance sont déjà engagés dans le projet.

Les prochaines tâches prioritaires sont la couverture des règles d’autorisation par des tests ciblés, la revue des règles métier restantes, la finition UX, puis la campagne complète de tests E2E en fin de développement.
