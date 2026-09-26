"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

interface GuideStep {
  label: string;
  href: string;
  description: string;
}

interface GuideSection {
  title: string;
  intro: string;
  steps: GuideStep[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: "1. Mise en route — préparer l’école",
    intro:
      "À faire une seule fois au début de l’année, dans l’ordre. Chaque étape dépend de la précédente.",
    steps: [
      {
        label: "Créer l’année scolaire",
        href: "/schoolYear",
        description:
          "Ex. « 2026-2027 » avec ses dates, puis activez-la. Une seule année doit rester ACTIVE.",
      },
      {
        label: "Créer les périodes",
        href: "/period",
        description:
          "Trimestres ou semestres rattachés à l’année active. Les notes et bulletins sont calculés par période.",
      },
      {
        label: "Créer les salles",
        href: "/classroom",
        description:
          "Nom + capacité. La capacité sert au placement automatique des élèves pendant les examens.",
      },
      {
        label: "Créer les classes",
        href: "/class",
        description:
          "Niveau et capacité, rattachés à l’année active. Ex. « 6ème A ».",
      },
      {
        label: "Créer les matières",
        href: "/course",
        description:
          "Mathématiques, Français… avec un code et un coefficient qui pondérera les moyennes.",
      },
    ],
  },
  {
    title: "2. Équipe pédagogique et cours",
    intro:
      "Qui enseigne quoi, à qui, et quand. Les enseignants ne voient ensuite que leurs propres classes.",
    steps: [
      {
        label: "Créer les comptes enseignants",
        href: "/users/add",
        description:
          "Configuration → Utilisateurs → Ajouter, rôle « Instructor ». L’enseignant verra ses affectations à la connexion.",
      },
      {
        label: "Créer les affectations",
        href: "/assignment",
        description:
          "Lien enseignant + classe + matière pour l’année. C’est la base de l’emploi du temps, des notes et des bulletins.",
      },
      {
        label: "Construire l’emploi du temps",
        href: "/schedule",
        description:
          "Ajoutez des créneaux par affectation (jour, heures, salle). Une matière peut apparaître plusieurs fois par semaine ; un cours peut être annulé ou déplacé avec motif.",
      },
      {
        label: "Inscrire les élèves",
        href: "/student",
        description:
          "Créez le dossier (nom, matricule, classe). L’inscription annuelle est enregistrée automatiquement et conserve l’historique d’une année à l’autre.",
      },
    ],
  },
  {
    title: "3. Notes et bulletins",
    intro:
      "Le cycle complet : évaluation → notes → bulletin validé, visible par les familles.",
    steps: [
      {
        label: "Créer les évaluations",
        href: "/assessments",
        description:
          "Interrogation, devoir, projet, examen ou rattrapage : barème, coefficient, période, puis « Publier aux familles ».",
      },
      {
        label: "Saisir les notes",
        href: "/grade",
        description:
          "Par élève et par évaluation. Le serveur refuse toute note au-dessus du barème ; l’enseignant ne note que ses classes.",
      },
      {
        label: "Générer les bulletins",
        href: "/reports",
        description:
          "Choisissez une classe et une période : moyennes par matière, rang, moyenne de classe. Ajoutez l’appréciation puis « Valider » : les familles sont notifiées et voient le bulletin dans leur espace.",
      },
    ],
  },
  {
    title: "4. Examens",
    intro:
      "Sessions d’examen avec salles mélangées, plan de salle et surveillance.",
    steps: [
      {
        label: "Organiser une session",
        href: "/exams",
        description:
          "Créez la session pour l’année active, ajoutez les créneaux (matière, date, heure), mélangez facultativement les classes, allouez les salles (plan de salle avec place et matricule), puis affectez les surveillants — un surveillant ne reste pas dans la même salle.",
      },
    ],
  },
  {
    title: "5. Vie scolaire",
    intro: "Suivi quotidien des présences et communication avec les familles.",
    steps: [
      {
        label: "Faire l’appel",
        href: "/attendance",
        description:
          "Par créneau : présent, absent, retard ou excusé avec motif. Les familles voient les absences dans leur espace.",
      },
      {
        label: "Créer une conférence",
        href: "/events",
        description:
          "Réunion ou conférence : date, lieu, public concerné, confirmation de présence. Les invités répondent depuis leur espace.",
      },
    ],
  },
  {
    title: "6. Comptabilité — écolage",
    intro: "Module réservé à l’administration et au comptable.",
    steps: [
      {
        label: "Gérer l’écolage",
        href: "/finance",
        description:
          "Définissez les tarifs par classe et année, générez les échéances, enregistrez les paiements (total ou partiel) : le reste à payer et les reçus sont calculés automatiquement, avec suivi des retards.",
      },
    ],
  },
  {
    title: "7. Comptes des familles",
    intro:
      "Chaque élève et chaque parent accède à son espace depuis la page de connexion.",
    steps: [
      {
        label: "Créer le compte de l’élève",
        href: "/users/add",
        description:
          "Rôle « Élève », puis liez le dossier concerné : l’élève verra uniquement ses notes, son emploi du temps et ses paiements.",
      },
      {
        label: "Créer le compte du parent",
        href: "/users/add",
        description:
          "Rôle « Parent », puis cochez ses enfants (plusieurs enfants possibles, même d’une classe différente). Le parent consulte sans jamais pouvoir modifier.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="notebook-sheet rounded-2xl border border-amber-100 p-10 pl-20 shadow-lg">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Guide de l’école
          </h1>
          <p className="mt-2 text-slate-600">
            Suivez les chapitres dans l’ordre : chaque étape vous mène à la page
            où créer l’information. Cliquez sur un lien pour ouvrir le module.
          </p>
        </header>

        <div className="space-y-10">
          {GUIDE_SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-1 text-xl font-bold text-blue-900">
                {section.title}
              </h2>
              <p className="mb-4 text-sm italic text-slate-500">
                {section.intro}
              </p>
              <ol className="space-y-3">
                {section.steps.map((step) => (
                  <li
                    key={step.href + step.label}
                    className="flex items-start gap-3 rounded-lg bg-white/70 p-3"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      ✓
                    </span>
                    <div>
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-1 font-semibold text-blue-800 underline decoration-blue-300 underline-offset-2 hover:text-blue-600"
                      >
                        {step.label}
                        <FiArrowRight size={14} />
                      </Link>
                      <p className="text-sm text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-amber-200 pt-4 text-sm text-slate-500">
          Astuce : après chaque création, les familles concernées reçoivent une
          notification dans leur espace (notes, bulletins, cours annulés,
          paiements, conférences).
        </footer>
      </div>
    </div>
  );
}
