export interface Classroom {
  classroomId: number;
  name: string;
  capacity?: number | null;
  building?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { schedules: number };
}
