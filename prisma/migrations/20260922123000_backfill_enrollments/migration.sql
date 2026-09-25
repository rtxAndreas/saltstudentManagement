-- Preserve the current class/year of every existing student as the first
-- historical enrollment. Future class changes must create a new enrollment.
INSERT OR IGNORE INTO "Enrollment" (
  "studentId",
  "classId",
  "schoolYearId",
  "status",
  "enrolledAt"
)
SELECT
  s."studentId",
  s."classId",
  c."schoolYearId",
  CASE WHEN s."status" = 'ACTIVE' THEN 'ACTIVE' ELSE 'WITHDRAWN' END,
  s."createdAt"
FROM "Student" s
INNER JOIN "Class" c ON c."classId" = s."classId";
