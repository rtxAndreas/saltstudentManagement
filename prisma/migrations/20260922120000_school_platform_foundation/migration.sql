-- CreateTable
CREATE TABLE "ExamSession" (
    "examSessionId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "distributionType" TEXT NOT NULL DEFAULT 'BY_CLASS',
    "schoolYearId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSession_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamRoomAllocation" (
    "allocationId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examSessionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" DATETIME,
    CONSTRAINT "ExamRoomAllocation_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession" ("examSessionId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamRoomAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamRoomAllocation_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("classroomId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamSlot" (
    "examSlotId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examSessionId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSlot_examSessionId_fkey" FOREIGN KEY ("examSessionId") REFERENCES "ExamSession" ("examSessionId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("assignmentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamInvigilatorAssignment" (
    "examDutyId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "examSlotId" INTEGER NOT NULL,
    "classroomId" INTEGER NOT NULL,
    "invigilatorId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamInvigilatorAssignment_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "ExamSlot" ("examSlotId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamInvigilatorAssignment_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("classroomId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamInvigilatorAssignment_invigilatorId_fkey" FOREIGN KEY ("invigilatorId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "enrollmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("classId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Guardian" (
    "guardianId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "occupation" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GuardianStudent" (
    "guardianId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'GUARDIAN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("guardianId", "studentId"),
    CONSTRAINT "GuardianStudent_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian" ("guardianId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GuardianStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assessment" (
    "assessmentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXAM',
    "maxScore" REAL NOT NULL DEFAULT 20,
    "coefficient" REAL NOT NULL DEFAULT 1,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "assignmentId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Assessment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("assignmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Assessment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("periodId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "audience" TEXT NOT NULL DEFAULT 'USER',
    "classId" INTEGER,
    "roleTarget" TEXT,
    "createdById" INTEGER,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "readAt" DATETIME,
    "deliveredAt" DATETIME,

    PRIMARY KEY ("notificationId", "userId"),
    CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("notificationId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "feeStructureId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "schoolYearId" INTEGER NOT NULL,
    "classId" INTEGER,
    "label" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'ONCE',
    "dueDay" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FeeStructure_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("classId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentInvoice" (
    "invoiceId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "enrollmentId" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentInvoice_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment" ("enrollmentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "paymentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "receivedById" INTEGER NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "StudentInvoice" ("invoiceId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receipt" (
    "receiptId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Receipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("paymentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Grade" (
    "gradeId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" REAL NOT NULL,
    "maxScore" REAL NOT NULL DEFAULT 20,
    "comment" TEXT,
    "studentId" INTEGER NOT NULL,
    "periodId" INTEGER NOT NULL,
    "assignmentId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "assessmentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period" ("periodId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("assignmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Grade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("assessmentId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Grade" ("assignmentId", "comment", "createdAt", "createdById", "gradeId", "maxScore", "periodId", "studentId", "updatedAt", "value") SELECT "assignmentId", "comment", "createdAt", "createdById", "gradeId", "maxScore", "periodId", "studentId", "updatedAt", "value" FROM "Grade";
DROP TABLE "Grade";
ALTER TABLE "new_Grade" RENAME TO "Grade";
CREATE UNIQUE INDEX "Grade_assessmentId_studentId_key" ON "Grade"("assessmentId", "studentId");
CREATE TABLE "new_Schedule" (
    "scheduleId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "classroomId" INTEGER,
    "assignmentId" INTEGER NOT NULL,
    "schoolYearId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "cancellationReason" TEXT,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("assignmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Schedule_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "SchoolYear" ("schoolYearId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Schedule_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom" ("classroomId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("assignmentId", "classroomId", "createdAt", "dayOfWeek", "endTime", "scheduleId", "schoolYearId", "startTime", "updatedAt") SELECT "assignmentId", "classroomId", "createdAt", "dayOfWeek", "endTime", "scheduleId", "schoolYearId", "startTime", "updatedAt" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
CREATE INDEX "Schedule_assignmentId_schoolYearId_idx" ON "Schedule"("assignmentId", "schoolYearId");
CREATE TABLE "new_Student" (
    "studentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registrationNumber" TEXT,
    "lastname" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "birthPlace" TEXT,
    "address" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "classId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("classId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("userId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("address", "birthDate", "birthPlace", "classId", "createdAt", "firstname", "gender", "lastname", "parentEmail", "parentPhone", "registrationNumber", "status", "studentId", "updatedAt") SELECT "address", "birthDate", "birthPlace", "classId", "createdAt", "firstname", "gender", "lastname", "parentEmail", "parentPhone", "registrationNumber", "status", "studentId", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_registrationNumber_key" ON "Student"("registrationNumber");
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ExamSession_schoolYearId_idx" ON "ExamSession"("schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoomAllocation_examSessionId_studentId_key" ON "ExamRoomAllocation"("examSessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoomAllocation_examSessionId_classroomId_seatNumber_key" ON "ExamRoomAllocation"("examSessionId", "classroomId", "seatNumber");

-- CreateIndex
CREATE INDEX "ExamSlot_examSessionId_startsAt_idx" ON "ExamSlot"("examSessionId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSlot_examSessionId_assignmentId_startsAt_key" ON "ExamSlot"("examSessionId", "assignmentId", "startsAt");

-- CreateIndex
CREATE INDEX "ExamInvigilatorAssignment_classroomId_examSlotId_idx" ON "ExamInvigilatorAssignment"("classroomId", "examSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamInvigilatorAssignment_examSlotId_invigilatorId_key" ON "ExamInvigilatorAssignment"("examSlotId", "invigilatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamInvigilatorAssignment_examSlotId_classroomId_invigilatorId_key" ON "ExamInvigilatorAssignment"("examSlotId", "classroomId", "invigilatorId");

-- CreateIndex
CREATE INDEX "Enrollment_classId_schoolYearId_status_idx" ON "Enrollment"("classId", "schoolYearId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_schoolYearId_key" ON "Enrollment"("studentId", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");

-- CreateIndex
CREATE INDEX "Assessment_assignmentId_periodId_idx" ON "Assessment"("assignmentId", "periodId");

-- CreateIndex
CREATE INDEX "Notification_classId_publishedAt_idx" ON "Notification"("classId", "publishedAt");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_readAt_idx" ON "NotificationRecipient"("userId", "readAt");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolYearId_classId_active_idx" ON "FeeStructure"("schoolYearId", "classId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvoice_reference_key" ON "StudentInvoice"("reference");

-- CreateIndex
CREATE INDEX "StudentInvoice_enrollmentId_status_dueDate_idx" ON "StudentInvoice"("enrollmentId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_paidAt_idx" ON "Payment"("invoiceId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_paymentId_key" ON "Receipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_number_key" ON "Receipt"("number");
