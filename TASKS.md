# Task log

This file is the continuity note for the school-management application. Update it after each meaningful task so development can resume without reconstructing the previous conversation.

## Completed work

- Core modules: authentication, users, students, classes, courses, school years, periods, assignments, grades, schedules, settings, and dashboard.
- Administration UX: role-aware navigation, instructor restrictions, list search, pagination for classes and courses, deletion confirmation, and self-deletion protection.
- Authorization: server-side role guards and protected API routes for administrators, instructors, accountants, students, and parents.
- School platform foundation: student/parent portal, enrollments, finance, invoices/payments, notifications, exams, exam slots, room allocation, and invigilation duties.
- Events and attendance: persistent school events, RSVP support, attendance records, family notifications, admin/teacher screens, and Prisma migrations.
- Assessments: assessment records, grade integration, score validation, and notification creation.
- Test preparation: E2E seed data and coverage for authentication, permissions, users, students, classes, courses, periods, school years, assignments, and grades.

## Verification status

- TypeScript compilation has passed after the latest platform changes.
- Prisma formatting, generation, validation, and migrations have been run during the platform work.
- E2E execution is intentionally postponed until feature development is complete. The environment previously lacked the Chromium browser needed for the full suite.

## Latest completed task

Strengthened attendance business rules. The attendance API now verifies that the schedule exists, the student exists, and the student belongs to the class attached to the selected schedule. Instructor ownership checks remain enforced.

Verification: `tsc --noEmit`, focused ESLint, and `git diff --check` all pass.

## Latest completed task

Strengthened cross-record authorization. Instructor queries for attendance, grades, and schedules are now scoped to their own assignments. Grade creation and updates now require instructor or administrator access. Added targeted E2E coverage for instructor attendance and grade visibility.

Verification: `./node_modules/.bin/tsc --noEmit`, focused ESLint, and `git diff --check` pass. The targeted Playwright test is currently blocked by the sandbox refusing Next.js to listen on port 3000 (`listen EPERM`).

## Latest completed task

Completed the next business-rule review. Grade updates now reject values above the existing maximum score even when the maximum is not included in the update payload. Exam slots now reject assignments belonging to a different school year than the exam session.

Verification: `./node_modules/.bin/tsc --noEmit`, focused ESLint, `git diff --check`, and the targeted Playwright suite pass (`2 passed`). No process was detected on port 3000; the earlier failure was caused by the sandbox restriction on local port binding.

## Final verification

The planned authorization review, business-rule hardening, UX lint cleanup, and E2E coverage are complete.

Final verification passed:

- `./node_modules/.bin/tsc --noEmit`;
- `./node_modules/.bin/eslint .`;
- `./node_modules/.bin/prisma validate`;
- `./node_modules/.bin/next build`;
- `./node_modules/.bin/playwright test` — 28 tests passed;
- `git diff --check`.

The application is ready for the deployment preparation stage. Production deployment itself still requires the target hosting environment, production database configuration, secrets, backups, and a deployment decision.

## Portal completion

Completed the parent/student UI review. The portal now exposes the student profile, class details, schedule empty state, grades and averages, exam rooms, attendance reasons with readable statuses, invoices with payment receipts, notifications with empty state, and event RSVP actions for attendance or decline.

Verification: portal TypeScript and ESLint checks pass, full ESLint passes, and the Next.js production build passes.

## UI polish

Improved the shared UI theme for parent, student, teacher, and administration spaces: lighter application background, clearer top bar, modernized sidebar branding, improved search and logout controls, and a more prominent dashboard header.

Verification: TypeScript, full ESLint, and `git diff --check` pass after the UI changes.

## Report cards module

Delivered the bulletin module from the cahier des charges (section "Bulletins et rapports"):

- New `ReportCard` model (enrollment + period unique pair, general average, rank, class size, appreciation, DRAFT/VALIDATED status, validation stamp) with enum `ReportCardStatus` and `NotificationType.REPORT_CARD`.
- Migration `20260924120000_report_cards`. Note: `prisma migrate dev` fails on the pre-existing shadow-database history (P3006 in `20260922120000_school_platform_foundation`), so the SQL was generated with `prisma migrate diff`, applied via `prisma db execute`, and marked with `migrate resolve --applied`.
- `lib/reportCards.ts`: per-course weighted averages (normalized on 20), general average, competition ranking with ties, class average.
- `GET/POST /api/report-cards`: class results view (admin + instructor scoped to their own classes), generation/refresh, optional class-wide validation.
- `GET/PATCH /api/report-cards/[id]`: role-aware access (admin, instructor of the class, owning student, linked parent), appreciation editing, validation with automatic family notification.
- `/reports` page: per-class results table (course averages, general average, rank, status, generation and validation buttons).
- `/reports/[id]` page: printable individual report card (print CSS hides the chrome), admin appreciation editing and validation.
- Portal: validated report cards are listed per child with a link to the printable bulletin; drafts stay internal.

Verification: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, `prisma validate`, `next build`, and `git diff --check` all pass.

## Role spaces and portal split

Restructured the UI into per-role tree navigation and split the portal into dedicated pages:

- `Constants.ts` now defines one navigation tree per role (admin groups: Scolarité/Pédagogie/Examens/Communication/Configuration; instructor: Enseignement; accountant: Comptabilité; student and parent: Vie scolaire + Administratif under /portal/*).
- `NavLinks` picks the tree via `getNavigationForRole`, keeps the collapsible scrolling sidebar, and treats /dashboard and /portal as exact-match active items.
- Portal split: shared `PortalProvider` context (one /api/portal fetch) + child selector in the new portal layout; pages now: dashboard (/portal), schedule, grades, reports, exams, finance, notifications, events.
- `proxy.ts` middleware previously redirected students/parents away from any path except exactly /portal; now allows /portal/* sub-pages and /reports/[id] (printable bulletin), and accountants may visit /events. /reports added to protected paths.
- Seed: e2e.student@test.com / e2e.student2@test.com (STUDENT, linked to students Jane/John Doe) and e2e.parent@test.com (PARENT guardian linked to both children), enrollments, and a partially paid invoice E2E-INV-001. Credentials recorded in e2e/helpers.ts.
- New `e2e/portal.spec.ts` covers parent tree + child selector + timetable + fees, student tree + results, admin grouped tree + bulletins, instructor tree without user management.

Verification: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, `prisma validate`, `next build`, and the full Playwright suite pass (32 tests, including the 4 new role-space tests).

## CDC reconciliation and students directory

Re-read CAHIER_DES_CHARGES.md and fixed the gaps found, plus delivered the paginated students directory:

- Students directory rebuilt for large datasets: server-side pagination (page/limit 10-25-50), debounced search (350 ms), class/status/gender filters, 4 stats cards, professional table with pastel badges and discreet row actions (view/edit/toggle/delete), smart pagination with ellipsis, CSV export, column visibility, bulk activate/deactivate, skeletons and empty state. Form moved into a modal reusing the existing StudentForm.
- `GET /api/student` now supports `?page=&limit=&search=&status=&gender=` returning `{ data, pagination, stats }`; without `page` it still returns a plain array so existing consumers (grade form, user form, attendance) keep working.
- CDC 2.1: `app/api/user/[id]` now treats SUPER_ADMIN as an administrator (it was previously excluded), only the SUPER_ADMIN can edit status/role or delete an administrator account, role grants to admin levels are SUPER_ADMIN-only, and self-deletion is blocked.
- CDC 3.1: login now rejects accounts whose status is not ACTIVE.
- CDC 3.2: account activation/deactivation added (PUT status on /api/user/[id] with the same SUPER_ADMIN protections, no self status change) with a status badge and toggle button in the users page.
- Page /help: notebook-style guide ("Guide de l'école") explaining how to create each feature, linked from staff navigation. Global background is now a subtle millimeter-paper grid.
- e2e/student.spec.ts rewritten for the new UI (modal, validation, search + page size); spec selectors scoped to the dialog.

Verification: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/eslint .`, `prisma validate`, `next build`, and the full Playwright suite pass (34 tests).

## Working agreement

- Preserve the existing uncommitted work unless a change is directly related to the current task.
- Do not run the full E2E suite before the development pass is complete.
- Record the result and verification command in this file after each task.
