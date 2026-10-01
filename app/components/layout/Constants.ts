export interface NavItem {
  href: string;
  label: string;
}

export const NAVIGATION_ROUTES: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schoolYear", label: "SchoolYear" },
  { href: "/period", label: "Period" },
  { href: "/users", label: "Users" },
];
