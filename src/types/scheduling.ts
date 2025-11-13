export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate: string;
  status: EmployeeStatus;
  contractType: ContractType;
  hourlyRate: number;
  weeklyHours: number;
  photoUrl?: string;
  color: string;
  active: boolean;
  language: 'FR' | 'NL' | 'EN';
  experience_level?: 'NOUVEAU' | 'VETERANE' | 'MANAGER';
  hire_date?: string;
  annualLeaveDays: number;
  sickLeaveDays: number;
  currentYear: number;
}

export interface EmployeeStatus {
  id: string;
  code: string;
  label: string;
  hoursLimits: {
    weekly: number;
    monthly: number;
    yearly: number;
  };
  isStudent: boolean;
  color: string;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  address: string;
  contactInfo: {
    phone?: string;
    email?: string;
  };
  openingHours: { [day: string]: { start: string; end: string } };
  managerId?: string;
  capacity: number;
  active: boolean;
}

export interface Shift {
  id: string;
  siteId: string;
  date: string;
  startTime: string;
  endTime: string;
  requirements: {
    minEmployees: number;
    maxEmployees: number;
    requiredSkills?: string[];
  };
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'PUBLISHED' | 'COMPLETED';
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  shiftId: string;
  employeeId: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'DECLINED';
  role?: string;
  score?: number;
}

export interface AvailabilityPattern {
  id: string;
  employeeId: string;
  patternName: string;
  patternType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  timeSlots: TimeSlot[];
  confidenceLevel: 1 | 2 | 3 | 4 | 5;
  validFrom: string;
  validUntil?: string;
  active: boolean;
}

export interface TimeSlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface AvailabilityException {
  id: string;
  employeeId: string;
  date: string;
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startTime?: string;
  endTime?: string;
  reason: string;
  approved: boolean;
}

export type ContractType = 'CDI' | 'CDD' | 'STUDENT' | 'INTERN' | 'FREELANCE';

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  leaveType: 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY';
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeLeaveSummary {
  employeeId: string;
  annualLeaveDays: number;
  sickLeaveDays: number;
  usedAnnualLeave: number;
  usedSickLeave: number;
  pendingLeaves: number;
  remainingAnnualLeave: number;
  remainingSickLeave: number;
}

export interface PlanningGeneration {
  id: string;
  periodStart: string;
  periodEnd: string;
  siteIds: string[];
  status: 'RUNNING' | 'COMPLETED' | 'APPLIED' | 'FAILED';
  results?: {
    score: number;
    conflicts: string[];
    coverage: number;
  };
  createdAt: string;
}