export interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  children?: NavItem[];
}

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  {
    href: "/scolarite",
    label: "Scolarité",
    children: [
      { href: "/schoolYear", label: "Années scolaires" },
      { href: "/period", label: "Périodes" },
      { href: "/class", label: "Classes" },
      { href: "/student", label: "Élèves" },
    ],
  },
  {
    href: "/pedagogie",
    label: "Pédagogie",
    children: [
      { href: "/course", label: "Matières" },
      { href: "/assignment", label: "Affectations" },
      { href: "/schedule", label: "Emploi du temps" },
      { href: "/assessments", label: "Évaluations" },
      { href: "/grade", label: "Notes" },
      { href: "/reports", label: "Bulletins" },
      { href: "/attendance", label: "Présences" },
    ],
  },
  {
    href: "/examens",
    label: "Examens",
    children: [
      { href: "/exams", label: "Sessions" },
      { href: "/classroom", label: "Salles" },
    ],
  },
  {
    href: "/communication",
    label: "Communication",
    children: [{ href: "/events", label: "Conférences" }],
  },
  {
    href: "/configuration",
    label: "Configuration",
    children: [
      { href: "/users", label: "Utilisateurs", adminOnly: true },
      { href: "/settings", label: "Paramètres" },
    ],
  },
  {
    href: "/comptabilite",
    label: "Comptabilité",
    children: [{ href: "/finance", label: "Écolage et paiements" }],
  },
  { href: "/help", label: "Aide" },
];

const INSTRUCTOR_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  {
    href: "/enseignement",
    label: "Enseignement",
    children: [
      { href: "/schedule", label: "Emploi du temps" },
      { href: "/assignment", label: "Mes affectations" },
      { href: "/assessments", label: "Évaluations" },
      { href: "/grade", label: "Notes" },
      { href: "/attendance", label: "Présences" },
      { href: "/reports", label: "Bulletins" },
    ],
  },
  {
    href: "/communication",
    label: "Communication",
    children: [{ href: "/events", label: "Conférences" }],
  },
  { href: "/help", label: "Aide" },
];

const ACCOUNTANT_NAV: NavItem[] = [
  {
    href: "/comptabilite",
    label: "Comptabilité",
    children: [{ href: "/finance", label: "Écolage et paiements" }],
  },
  {
    href: "/communication",
    label: "Communication",
    children: [{ href: "/events", label: "Conférences" }],
  },
  { href: "/help", label: "Aide" },
];

const STUDENT_NAV: NavItem[] = [
  { href: "/portal", label: "Tableau de bord" },
  {
    href: "/vie-scolaire",
    label: "Vie scolaire",
    children: [
      { href: "/portal/schedule", label: "Emploi du temps" },
      { href: "/portal/exams", label: "Examens" },
      { href: "/portal/grades", label: "Résultats" },
      { href: "/portal/reports", label: "Bulletins" },
    ],
  },
  {
    href: "/ma-vie",
    label: "Administratif",
    children: [
      { href: "/portal/finance", label: "Mes paiements" },
      { href: "/portal/events", label: "Événements" },
      { href: "/portal/notifications", label: "Notifications" },
    ],
  },
];

const PARENT_NAV: NavItem[] = [
  { href: "/portal", label: "Mes enfants" },
  {
    href: "/vie-scolaire",
    label: "Suivi de l'enfant",
    children: [
      { href: "/portal/schedule", label: "Emploi du temps" },
      { href: "/portal/exams", label: "Examens" },
      { href: "/portal/grades", label: "Résultats" },
      { href: "/portal/reports", label: "Bulletins" },
    ],
  },
  {
    href: "/ma-vie",
    label: "Administratif",
    children: [
      { href: "/portal/finance", label: "Paiements" },
      { href: "/portal/events", label: "Conférences" },
      { href: "/portal/notifications", label: "Notifications" },
    ],
  },
];

export const NAVIGATION_ROUTES: NavItem[] = ADMIN_NAV;

export function getNavigationForRole(role?: string): NavItem[] {
  switch (role) {
    case "STUDENT":
      return STUDENT_NAV;
    case "PARENT":
      return PARENT_NAV;
    case "ACCOUNTANT":
      return ACCOUNTANT_NAV;
    case "INSTRUCTOR":
      return INSTRUCTOR_NAV;
    default:
      return ADMIN_NAV;
  }
}
