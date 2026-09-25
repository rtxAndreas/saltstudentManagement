import { seedDatabase } from "../scripts/seed-e2e";

export default async function globalSetup() {
  const seeded = await seedDatabase();
  console.log("[global-setup] Database seeded:", {
    admin: seeded.admin.email,
    instructors: seeded.instructors.length,
    supervisors: seeded.supervisors.length,
  });
}
