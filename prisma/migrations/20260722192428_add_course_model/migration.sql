-- CreateTable
CREATE TABLE "Course" (
    "courseId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL,
    "statusCourse" TEXT NOT NULL DEFAULT 'ACTIVE'
);

-- CreateTable
CREATE TABLE "_ClassToCourse" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_ClassToCourse_A_fkey" FOREIGN KEY ("A") REFERENCES "Class" ("classId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClassToCourse_B_fkey" FOREIGN KEY ("B") REFERENCES "Course" ("courseId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClassToCourse_AB_unique" ON "_ClassToCourse"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassToCourse_B_index" ON "_ClassToCourse"("B");
