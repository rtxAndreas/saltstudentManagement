export type Invoice = {
  invoiceId: number;
  reference: string;
  label: string;
  totalAmount: string;
  paidAmount: string;
  dueDate: string;
  status: string;
  payments: Array<{
    paymentId: number;
    amount: string;
    receipt: { number: string } | null;
  }>;
};

export type ChildData = {
  student: {
    studentId: number;
    firstname: string;
    lastname: string;
    gender: string;
    birthDate: string;
    registrationNumber: string | null;
    class: { name: string; level: string };
    enrollments: Array<{ invoices: Invoice[] }>;
  };
  schedules: Array<{
    scheduleId: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    status: string;
    cancellationReason: string | null;
    classroom: { name: string } | null;
    assignment: {
      course: { name: string };
      teacher: { name: string; lastname: string };
    };
  }>;
  grades: Array<{
    gradeId: number;
    value: number;
    maxScore: number;
    comment: string | null;
    period: { label: string };
    assignment: { course: { name: string } };
  }>;
  averages: Array<{ courseId: number; course: string; average: number }>;
  generalAverage: number | null;
  examRooms: Array<{
    allocationId: number;
    seatNumber: number;
    classroom: { name: string };
    examSession: { title: string; startDate: string };
  }>;
  attendance: Array<{
    attendanceId: number;
    date: string;
    status: string;
    reason: string | null;
    schedule: { assignment: { course: { name: string } } };
  }>;
  reportCards: Array<{
    reportCardId: number;
    generalAverage: number;
    rank: number;
    classSize: number;
    status: string;
    period: { label: string };
  }>;
};

export type PortalData = {
  role: "STUDENT" | "PARENT";
  children: ChildData[];
  notifications: Array<{
    readAt: string | null;
    notification: {
      notificationId: number;
      title: string;
      message: string;
      type: string;
      publishedAt: string;
    };
  }>;
  events: Array<{
    response: string;
    event: {
      eventId: number;
      title: string;
      description: string | null;
      type: string;
      startsAt: string;
      endsAt: string;
      location: string | null;
      requiresConfirmation: boolean;
    };
  }>;
};

export const dayLabels: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
};

export const dayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export const attendanceLabels: Record<string, string> = {
  PRESENT: "Présent",
  ABSENT: "Absent",
  LATE: "En retard",
  EXCUSED: "Excusé",
};
export const responseLabels: Record<string, string> = {
  PENDING: "Réponse attendue",
  ATTENDING: "Présence confirmée",
  DECLINED: "Participation refusée",
};
export const invoiceStatusLabels: Record<string, string> = {
  PAID: "Payée",
  PARTIALLY_PAID: "Partiellement payée",
  PENDING: "En attente",
  CANCELLED: "Annulée",
};

/** JS getDay() (0 = Sunday) to the schedule day enum. */
export function currentDayEnum(): string | null {
  const map = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const day = map[new Date().getDay()];
  return day === "SUNDAY" ? null : day;
}
