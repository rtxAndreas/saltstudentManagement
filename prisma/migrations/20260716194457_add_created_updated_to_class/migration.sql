/*
  Warnings:

  - Added the required column `updatedAt` to the `Class` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Class" (
    "classId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    CONSTRAINT "Class_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Class" ("classId", "niveau", "nom", "schoolYearId", "status") SELECT "classId", "niveau", "nom", "schoolYearId", "status" FROM "Class";
DROP TABLE "Class";
ALTER TABLE "new_Class" RENAME TO "Class";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
