export type PageType =
  | "dashboard"
  | "members"
  | "daily_collection"
  | "receipts"
  | "reports"
  | "settings";

export type Role = "Super Admin" | "Administrator" | "Employee" | "Member";

export interface User {
  username: string;
  role: Role;
  name?: string;
  memberId?: string;
  photo?: string;
}

export interface MemberPlan {
  id: string;
  dailyAmount: number;
  status: "Active" | "Paused" | "Closed";
  startDate: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  aadhaar: string;
  address: string;
  plan: string;
  joinDate: string;
  dailyAmount: string;
  nomineeName: string;
  nomineePhone: string;
  status: "Active" | "Inactive";
  balance?: string; // Optional, to keep compatibility with existing balance logic
  registeredBy?: string; // Employee ID or 'admin'
  plans?: MemberPlan[];
  registrationStatus?: string; // e.g. "Verified"
  planUnits?: number;
  photo?: string;
  password?: string;
  accountStatus?: "Active" | "Inactive" | "Locked" | "Disabled";
  failedLoginAttempts?: number;
  lockUntil?: number;
}

export interface Collection {
  id: string;
  receiptNo?: string;
  memberId: string;
  memberName: string;
  amount: string;
  type: string;
  notes: string;
  timestamp: string;
  status: string;
  collectedBy?: string; // Employee ID or 'admin'
  collectedByName?: string; // Employee Name or 'Admin'
}

export interface Employee {
  id: string; // EMP001, EMP002...
  name: string;
  phone: string;
  email: string;
  address: string;
  aadhaar: string;
  designation: string;
  branch: string;
  username: string;
  password?: string;
  dailyTarget: string;
  monthlySalary: string;
  commissionPercentage: string;
  registrationCommission?: string;
  joinDate: string;
  status: "Active" | "Inactive";
  photo?: string;
  accountStatus?: "Active" | "Inactive" | "Locked" | "Disabled";
  failedLoginAttempts?: number;
  lockUntil?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent" | "Half Day" | "Leave";
  checkIn?: string;
  checkOut?: string;
}

export interface LoginHistoryRecord {
  id: string;
  employeeId?: string;
  username: string;
  role: string;
  loginTime: string;
  logoutTime?: string;
  status: "Successful" | "Failed";
  ipAddress?: string;
  device?: string;
  timestamp: string;
}

export interface FinancialSummary {
  totalSavings: number;
  totalBonus: number;
  totalCompanyProfit: number;
  totalCompanyCommission: number;
  registrationRevenue: number;
  todayRegistrationRevenue: number;
  todayRegistrationsCount: number;
  todayCollection: number;
  todayTransactionsCount: number;
  companyDailyProfit: number;
  totalCompanyRevenue: number;
}

export interface CompanySettings {
  companyName: string;
  registrationNumber: string;
  address: string;
  contactEmail: string;
  supportPhone: string;
  adminPassword?: string;
  adminPhoto?: string;
  adminName?: string;
  adminPhone?: string;
  adminEmail?: string;

  registrationFee?: string;
  dailyDeposit?: string;
  memberSavings?: string;
  companyCollection?: string;
  bonusPercentage?: string;
  companyProfitPercentage?: string;
  planDuration?: string;
  employeeCommissionPerCollection?: string;

  // legacy
  defaultDailyAmount?: string;
  companyCommission?: string;
  lateFeePenalty?: string;

  // New general settings
  companyLogo?: string;
  website?: string;
  gstNumber?: string;

  // New financial settings
  gracePeriod?: string;

  // New receipt settings
  receiptPrefix?: string;
  receiptFooter?: string;
  companyStamp?: string;
  authorizedSignature?: string;
  autoReceiptNumber?: boolean;

  // New user settings
  adminUsername?: string;
  employeePasswordReset?: string;
  sessionTimeout?: string;

  // New backup settings
  autoBackup?: boolean;
  backupInterval?: string;

  // New notification settings
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  paymentReminderDays?: string;
  maturityReminderDays?: string;

  // Security settings
  sessionTimeoutValue?: string; // "15", "30", "60", "Never"
  autoLogoutEnabled?: boolean;
  logoutOnBrowserClose?: boolean;
  maxFailedLoginAttempts?: number;
}

export interface CommissionPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  referenceNumber: string;
  remarks: string;
  status: "Paid" | "Pending";
  timestamp: string;
  period?: string; // YYYY-MM or similar cycle
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  username?: string;
  role?: string;
  module?: string;
  status?: string;
  ipAddress?: string;
  device?: string;
}

export interface ReminderHistoryItem {
  id: string;
  reminderDate: string; // YYYY-MM-DD or full timestamp
  memberId: string;
  memberName: string;
  dueAmount: number;
  status: string;
}
