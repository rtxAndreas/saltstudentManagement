-- CreateTable
CREATE TABLE "Class" (
    "classId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "schoolYearId" INTEGER NOT NULL,
    CONSTRAINT "Class_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE RESTRICT ON UPDATE CASCADE
);
