-- CreateTable
CREATE TABLE "ReportCard" (
    "reportCardId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "enrollmentId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "generalAverage" REAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "classSize" INTEGER NOT NULL,
    "appreciation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "validatedById" INTEGER,
    "validatedAt" DATETIME,
    CONSTRAINT "ReportCard_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("enrollmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportCard_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("periodId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReportCard_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User" ("userId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReportCard_periodId_status_idx" ON "ReportCard"("periodId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReportCard_enrollmentId_periodId_key" ON "ReportCard"("enrollmentId", "periodId");

