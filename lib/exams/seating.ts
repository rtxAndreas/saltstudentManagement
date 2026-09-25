export type SeatingStudent = {
  studentId: number;
  classId: number;
};

export type SeatingRoom = {
  classroomId: number;
  capacity: number;
};

export type SeatingAllocation = {
  studentId: number;
  classroomId: number;
  seatNumber: number;
};

function mixedOrder(students: SeatingStudent[]): SeatingStudent[] {
  const groups = new Map<number, SeatingStudent[]>();
  for (const student of students) {
    const group = groups.get(student.classId) ?? [];
    group.push(student);
    groups.set(student.classId, group);
  }

  const result: SeatingStudent[] = [];
  let previousClassId: number | null = null;
  while (result.length < students.length) {
    const candidates = [...groups.entries()]
      .filter(([, group]) => group.length > 0)
      .sort((a, b) => b[1].length - a[1].length || a[0] - b[0]);
    const selected =
      candidates.find(([classId]) => classId !== previousClassId) ??
      candidates[0];
    if (!selected) break;
    const [classId, group] = selected;
    result.push(group.shift()!);
    previousClassId = classId;
  }
  return result;
}

export function buildSeatingPlan(
  students: SeatingStudent[],
  rooms: SeatingRoom[],
  mixed: boolean,
): SeatingAllocation[] {
  if (
    rooms.some((room) => !Number.isInteger(room.capacity) || room.capacity <= 0)
  ) {
    throw new Error("Every selected classroom must have a positive capacity");
  }
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  if (students.length > totalCapacity) {
    throw new Error(
      `Insufficient classroom capacity: ${students.length} students for ${totalCapacity} seats`,
    );
  }

  const ordered = mixed
    ? mixedOrder(students)
    : [...students].sort(
        (a, b) => a.classId - b.classId || a.studentId - b.studentId,
      );
  const allocations: SeatingAllocation[] = [];
  let cursor = 0;
  for (const room of rooms) {
    for (
      let seatNumber = 1;
      seatNumber <= room.capacity && cursor < ordered.length;
      seatNumber++
    ) {
      allocations.push({
        studentId: ordered[cursor].studentId,
        classroomId: room.classroomId,
        seatNumber,
      });
      cursor += 1;
    }
  }
  return allocations;
}
