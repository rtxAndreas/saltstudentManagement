export interface User {
  userId: number;
  name: string;
  lastname: string;
  email: string;
  role: string;
  status?: "ACTIVE" | "INACTIVE";
  registrationNumber?: string | null;
  createdAt: string;
}
