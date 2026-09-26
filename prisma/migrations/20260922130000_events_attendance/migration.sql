-- CreateTable
CREATE TABLE "SchoolEvent" (
    "eventId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SCHOOL_EVENT',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "location" TEXT,
    "schoolYearId" INTEGER NOT NULL,
    "classId" INTEGER,
    "targetRole" TEXT,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchoolEvent_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SchoolEvent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("classId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SchoolEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventRecipient" (
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "response" TEXT NOT NULL DEFAULT 'PENDING',
    "respondedAt" DATETIME,

    PRIMARY KEY ("eventId", "userId"),
    CONSTRAINT "EventRecipient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SchoolEvent" ("eventId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "attendanceId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "scheduleId" INTEGER,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "recordedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("scheduleId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SchoolEvent_schoolYearId_startsAt_idx" ON "SchoolEvent"("schoolYearId", "startsAt");

-- CreateIndex
CREATE INDEX "SchoolEvent_classId_startsAt_idx" ON "SchoolEvent"("classId", "startsAt");

-- CreateIndex
CREATE INDEX "EventRecipient_userId_response_idx" ON "EventRecipient"("userId", "response");

-- CreateIndex
CREATE INDEX "Attendance_studentId_date_idx" ON "Attendance"("studentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_studentId_scheduleId_date_key" ON "Attendance"("studentId", "scheduleId", "date");
