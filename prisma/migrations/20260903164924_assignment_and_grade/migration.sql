/*
  Warnings:

  - You are about to drop the `Assignement` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "registrationNumber" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Assignement";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Assignment" (
    "assignmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teacherId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("classId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assignment_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grade" (
    "gradeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "maxScore" REAL NOT NULL DEFAULT 20,
    "comment" TEXT,
    "studentId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("periodId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("assignmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_teacherId_classId_courseId_schoolYearId_key" ON "Assignment"("teacherId", "classId", "courseId", "schoolYearId");
