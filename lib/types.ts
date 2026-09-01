export type Role = "MANAGER" | "BRANCH_MANAGER";
export type VisitPurpose = "MEETING" | "DELIVERY" | "INTERVIEW" | "OTHER";
export type VisitStatus = "CHECKED_IN" | "CHECKED_OUT";

export interface Session {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
}

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
}

export interface CheckEmailResponse {
  exists: boolean;
}

export interface EntranceResolveResponse {
  entranceId: string;
  entranceName: string;
  branchId: string;
  branchName: string;
}

export interface PublicHostResponse {
  id: string;
  fullName: string;
  department: string | null;
}

export interface CheckInResponse {
  reference: string;
  checkInTime: string;
}

export interface CheckOutResponse {
  reference: string;
  fullName: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
}

export interface Entrance {
  id: string;
  branchId: string;
  name: string;
  active: boolean;
}

export interface Host {
  id: string;
  branchId: string;
  fullName: string;
  department: string | null;
  active: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  active: boolean;
  createdAt: string;
}

export interface Visit {
  id: string;
  branchId: string;
  branchName: string;
  entranceId: string;
  entranceName: string;
  fullName: string;
  phone: string;
  email: string | null;
  purpose: VisitPurpose;
  hostId: string;
  hostName: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: VisitStatus;
  reference: string;
  priorVisitCount: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/** All fields are scoped to the active filter set (date range, branch, weekdays, hour window, etc). */
export interface SummaryStats {
  total: number;
  checkedIn: number;
  checkedOut: number;
  checkoutCompletionRate: number;
  avgDurationMinutes: number | null;
}

export type Granularity = "HOUR" | "DAY" | "WEEK" | "MONTH";

export interface TimeSeriesPoint {
  bucket: string;
  count: number;
}

/** weekday is ISO (1 = Monday .. 7 = Sunday), hour is 0-23. */
export interface HeatmapCell {
  weekday: number;
  hour: number;
  count: number;
}

export interface PurposeStat {
  purpose: VisitPurpose;
  count: number;
}

export interface BranchStat {
  branchId: string;
  branchName: string;
  count: number;
}

export interface EntranceStat {
  entranceId: string;
  entranceName: string;
  count: number;
  lastScanAt: string | null;
}

export interface BulkCheckOutResponse {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}

export interface ProblemDetail {
  title?: string;
  detail?: string;
  status?: number;
  fieldErrors?: Record<string, string>;
}

export interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
}

export interface VerifyOtpResponse {
  token: string;
}
