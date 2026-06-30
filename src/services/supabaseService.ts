import { supabase } from "../lib/supabase";
import {
  Member,
  Collection,
  CompanySettings,
  AuditLog,
  Employee,
  AttendanceRecord,
  LoginHistoryRecord,
  CommissionPayment,
  ReminderHistoryItem,
} from "../types";

// --- Member Mappers ---
function toDbMember(m: Member) {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    aadhaar: m.aadhaar,
    address: m.address,
    plan: m.plan,
    join_date: m.joinDate,
    daily_amount: m.dailyAmount,
    nominee_name: m.nomineeName,
    nominee_phone: m.nomineePhone,
    status: m.status,
    balance: m.balance || null,
    registered_by: m.registeredBy || null,
    registration_status: m.registrationStatus || null,
    plan_units: m.planUnits || null,
    photo: m.photo || null,
    password: m.password || null,
    account_status: m.accountStatus || null,
    failed_login_attempts: m.failedLoginAttempts || 0,
    lock_until: m.lockUntil ? Number(m.lockUntil) : null,
    plans: m.plans || [],
  };
}

function fromDbMember(row: any): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    aadhaar: row.aadhaar,
    address: row.address,
    plan: row.plan,
    joinDate: row.join_date,
    dailyAmount: row.daily_amount,
    nomineeName: row.nominee_name,
    nomineePhone: row.nominee_phone,
    status: row.status,
    balance: row.balance || undefined,
    registeredBy: row.registered_by || undefined,
    registrationStatus: row.registration_status || undefined,
    planUnits: row.plan_units || undefined,
    photo: row.photo || undefined,
    password: row.password || undefined,
    accountStatus: row.account_status || undefined,
    failedLoginAttempts: row.failed_login_attempts || undefined,
    lockUntil: row.lock_until ? Number(row.lock_until) : undefined,
    plans: row.plans || [],
  };
}

// --- Collection Mappers ---
function toDbCollection(c: Collection) {
  return {
    id: c.id,
    receipt_no: c.receiptNo || null,
    member_id: c.memberId,
    member_name: c.memberName,
    amount: c.amount,
    type: c.type,
    notes: c.notes || null,
    timestamp: c.timestamp,
    status: c.status,
    collected_by: c.collectedBy || null,
    collected_by_name: c.collectedByName || null,
  };
}

function fromDbCollection(row: any): Collection {
  return {
    id: row.id,
    receiptNo: row.receipt_no || undefined,
    memberId: row.member_id,
    memberName: row.member_name,
    amount: row.amount,
    type: row.type,
    notes: row.notes || "",
    timestamp: row.timestamp,
    status: row.status,
    collectedBy: row.collected_by || undefined,
    collectedByName: row.collected_by_name || undefined,
  };
}

// --- Employee Mappers ---
function toDbEmployee(e: Employee) {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    email: e.email,
    address: e.address,
    aadhaar: e.aadhaar,
    designation: e.designation,
    branch: e.branch,
    username: e.username,
    password: e.password || null,
    daily_target: e.dailyTarget,
    monthly_salary: e.monthlySalary,
    commission_percentage: e.commissionPercentage,
    registration_commission: e.registrationCommission || null,
    join_date: e.joinDate,
    status: e.status,
    photo: e.photo || null,
    account_status: e.accountStatus || null,
    failed_login_attempts: e.failedLoginAttempts || 0,
    lock_until: e.lockUntil ? Number(e.lockUntil) : null,
  };
}

function fromDbEmployee(row: any): Employee {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    aadhaar: row.aadhaar,
    designation: row.designation,
    branch: row.branch,
    username: row.username,
    password: row.password || undefined,
    dailyTarget: row.daily_target,
    monthlySalary: row.monthly_salary,
    commissionPercentage: row.commission_percentage,
    registrationCommission: row.registration_commission || undefined,
    joinDate: row.join_date,
    status: row.status as "Active" | "Inactive",
    photo: row.photo || undefined,
    accountStatus: row.account_status || undefined,
    failedLoginAttempts: row.failed_login_attempts || undefined,
    lockUntil: row.lock_until ? Number(row.lock_until) : undefined,
  };
}

// --- Attendance Mappers ---
function toDbAttendance(a: AttendanceRecord) {
  return {
    id: a.id,
    employee_id: a.employeeId,
    date: a.date,
    status: a.status,
    check_in: a.checkIn || null,
    check_out: a.checkOut || null,
  };
}

function fromDbAttendance(row: any): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    status: row.status,
    checkIn: row.check_in || undefined,
    checkOut: row.check_out || undefined,
  };
}

// --- Login History Mappers ---
function toDbLoginHistory(lh: LoginHistoryRecord) {
  return {
    id: lh.id,
    employee_id: lh.employeeId || null,
    username: lh.username,
    role: lh.role,
    login_time: lh.loginTime,
    logout_time: lh.logoutTime || null,
    status: lh.status,
    ip_address: lh.ipAddress || null,
    device: lh.device || null,
    timestamp: lh.timestamp,
  };
}

function fromDbLoginHistory(row: any): LoginHistoryRecord {
  return {
    id: row.id,
    employeeId: row.employee_id || undefined,
    username: row.username,
    role: row.role,
    loginTime: row.login_time,
    logoutTime: row.logout_time || undefined,
    status: row.status as "Successful" | "Failed",
    ipAddress: row.ip_address || undefined,
    device: row.device || undefined,
    timestamp: row.timestamp,
  };
}

// --- Commission Payment Mappers ---
function toDbCommissionPayment(cp: CommissionPayment) {
  return {
    id: cp.id,
    employee_id: cp.employeeId,
    employee_name: cp.employeeName,
    amount: cp.amount,
    payment_date: cp.paymentDate,
    reference_number: cp.referenceNumber,
    remarks: cp.remarks,
    status: cp.status,
    timestamp: cp.timestamp,
    period: cp.period || null,
  };
}

function fromDbCommissionPayment(row: any): CommissionPayment {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    referenceNumber: row.reference_number,
    remarks: row.remarks,
    status: row.status as "Paid" | "Pending",
    timestamp: row.timestamp,
    period: row.period || undefined,
  };
}

// --- Reminder History Mappers ---
function toDbReminderHistory(rh: ReminderHistoryItem) {
  return {
    id: rh.id,
    reminder_date: rh.reminderDate,
    member_id: rh.memberId,
    member_name: rh.memberName,
    due_amount: rh.dueAmount,
    status: rh.status,
  };
}

function fromDbReminderHistory(row: any): ReminderHistoryItem {
  return {
    id: row.id,
    reminderDate: row.reminder_date,
    memberId: row.member_id,
    memberName: row.member_name,
    dueAmount: Number(row.due_amount),
    status: row.status,
  };
}

// --- Audit Log Mappers ---
function toDbAuditLog(al: AuditLog) {
  return {
    id: al.id,
    action: al.action,
    details: al.details,
    timestamp: al.timestamp,
    username: al.username || null,
    role: al.role || null,
    module: al.module || null,
    status: al.status || null,
    ip_address: al.ipAddress || null,
    device: al.device || null,
  };
}

function fromDbAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp,
    username: row.username || undefined,
    role: row.role || undefined,
    module: row.module || undefined,
    status: row.status || undefined,
    ipAddress: row.ip_address || undefined,
    device: row.device || undefined,
  };
}

let isSchemaMissing = false;

function handleSupabaseError(context: string, error: any) {
  const errMsg = error?.message || "";
  const errCode = error?.code || "";
  if (
    (errMsg.toLowerCase().includes("relation") && errMsg.toLowerCase().includes("does not exist")) ||
    errCode === "42P01" ||
    (errMsg.toLowerCase().includes("could not find") && errMsg.toLowerCase().includes("search path")) ||
    errMsg.toLowerCase().includes("api key") ||
    errMsg.toLowerCase().includes("invalid") ||
    errMsg.toLowerCase().includes("failed") ||
    errCode === "PGRST111" ||
    errCode === "PGRST301"
  ) {
    if (!isSchemaMissing) {
      isSchemaMissing = true;
      console.warn(`Supabase Schema Notice: Table missing or setup required for '${context}'. Please initialize the database schema by running the SQL setup script.`);
    }
  } else {
    console.warn(`Supabase notice for '${context}':`, error);
  }
}

export const supabaseService = {
  isSchemaMissing() {
    return isSchemaMissing;
  },
  setSchemaMissing(val: boolean) {
    isSchemaMissing = val;
  },

  // --- Members ---
  async getMembers(): Promise<Member[] | null> {
    try {
      const { data, error } = await supabase.from("members").select("*").order("id", { ascending: false });
      if (error) {
        handleSupabaseError("getting members", error);
        return null;
      }
      return data.map(fromDbMember);
    } catch (e) {
      console.error("Exception getting members:", e);
      return null;
    }
  },

  async saveMember(member: Member): Promise<boolean> {
    try {
      const dbRow = toDbMember(member);
      const { error } = await supabase.from("members").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving member", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving member:", e);
      return false;
    }
  },

  async deleteMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) {
        handleSupabaseError("deleting member", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception deleting member:", e);
      return false;
    }
  },

  // --- Collections ---
  async getCollections(): Promise<Collection[] | null> {
    try {
      const { data, error } = await supabase.from("collections").select("*").order("timestamp", { ascending: false });
      if (error) {
        handleSupabaseError("getting collections", error);
        return null;
      }
      return data.map(fromDbCollection);
    } catch (e) {
      console.error("Exception getting collections:", e);
      return null;
    }
  },

  async saveCollection(collection: Collection): Promise<boolean> {
    try {
      const dbRow = toDbCollection(collection);
      const { error } = await supabase.from("collections").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving collection", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving collection:", e);
      return false;
    }
  },

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) {
        handleSupabaseError("deleting collection", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception deleting collection:", e);
      return false;
    }
  },

  // --- Settings ---
  async getSettings(): Promise<CompanySettings | null> {
    try {
      const { data, error } = await supabase.from("settings").select("*").eq("id", "company_settings").single();
      if (error) {
        if (error.code === "PGRST116") {
          // Record not found: we should return null and the provider can initialize it
          return null;
        }
        handleSupabaseError("getting settings", error);
        return null;
      }
      return data.data as CompanySettings;
    } catch (e) {
      console.error("Exception getting settings:", e);
      return null;
    }
  },

  async saveSettings(settings: CompanySettings): Promise<boolean> {
    try {
      const { error } = await supabase.from("settings").upsert({
        id: "company_settings",
        data: settings,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        handleSupabaseError("saving settings", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving settings:", e);
      return false;
    }
  },

  // --- Employees ---
  async getEmployees(): Promise<Employee[] | null> {
    try {
      const { data, error } = await supabase.from("employees").select("*").order("id", { ascending: false });
      if (error) {
        handleSupabaseError("getting employees", error);
        return null;
      }
      return data.map(fromDbEmployee);
    } catch (e) {
      console.error("Exception getting employees:", e);
      return null;
    }
  },

  async saveEmployee(employee: Employee): Promise<boolean> {
    try {
      const dbRow = toDbEmployee(employee);
      const { error } = await supabase.from("employees").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving employee", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving employee:", e);
      return false;
    }
  },

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) {
        handleSupabaseError("deleting employee", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception deleting employee:", e);
      return false;
    }
  },

  // --- Attendance ---
  async getAttendance(): Promise<AttendanceRecord[] | null> {
    try {
      const { data, error } = await supabase.from("attendance").select("*").order("date", { ascending: false });
      if (error) {
        handleSupabaseError("getting attendance", error);
        return null;
      }
      return data.map(fromDbAttendance);
    } catch (e) {
      console.error("Exception getting attendance:", e);
      return null;
    }
  },

  async saveAttendance(attendance: AttendanceRecord): Promise<boolean> {
    try {
      const dbRow = toDbAttendance(attendance);
      const { error } = await supabase.from("attendance").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving attendance", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving attendance:", e);
      return false;
    }
  },

  // --- Login History ---
  async getLoginHistory(): Promise<LoginHistoryRecord[] | null> {
    try {
      const { data, error } = await supabase.from("login_history").select("*").order("timestamp", { ascending: false });
      if (error) {
        handleSupabaseError("getting login history", error);
        return null;
      }
      return data.map(fromDbLoginHistory);
    } catch (e) {
      console.error("Exception getting login history:", e);
      return null;
    }
  },

  async saveLoginHistory(record: LoginHistoryRecord): Promise<boolean> {
    try {
      const dbRow = toDbLoginHistory(record);
      const { error } = await supabase.from("login_history").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving login history", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving login history:", e);
      return false;
    }
  },

  // --- Commission Payments ---
  async getCommissionPayments(): Promise<CommissionPayment[] | null> {
    try {
      const { data, error } = await supabase.from("commission_payments").select("*").order("timestamp", { ascending: false });
      if (error) {
        handleSupabaseError("getting commission payments", error);
        return null;
      }
      return data.map(fromDbCommissionPayment);
    } catch (e) {
      console.error("Exception getting commission payments:", e);
      return null;
    }
  },

  async saveCommissionPayment(payment: CommissionPayment): Promise<boolean> {
    try {
      const dbRow = toDbCommissionPayment(payment);
      const { error } = await supabase.from("commission_payments").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving commission payment", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving commission payment:", e);
      return false;
    }
  },

  async deleteCommissionPayment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("commission_payments").delete().eq("id", id);
      if (error) {
        handleSupabaseError("deleting commission payment", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception deleting commission payment:", e);
      return false;
    }
  },

  // --- Reminder History ---
  async getReminderHistory(): Promise<ReminderHistoryItem[] | null> {
    try {
      const { data, error } = await supabase.from("reminder_history").select("*").order("reminder_date", { ascending: false });
      if (error) {
        handleSupabaseError("getting reminder history", error);
        return null;
      }
      return data.map(fromDbReminderHistory);
    } catch (e) {
      console.error("Exception getting reminder history:", e);
      return null;
    }
  },

  async saveReminderHistoryItem(item: ReminderHistoryItem): Promise<boolean> {
    try {
      const dbRow = toDbReminderHistory(item);
      const { error } = await supabase.from("reminder_history").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving reminder history item", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving reminder history item:", e);
      return false;
    }
  },

  // --- Audit Logs ---
  async getAuditLogs(): Promise<AuditLog[] | null> {
    try {
      const { data, error } = await supabase.from("audit_logs").select("*").order("timestamp", { ascending: false });
      if (error) {
        handleSupabaseError("getting audit logs", error);
        return null;
      }
      return data.map(fromDbAuditLog);
    } catch (e) {
      console.error("Exception getting audit logs:", e);
      return null;
    }
  },

  async saveAuditLog(log: AuditLog): Promise<boolean> {
    try {
      const dbRow = toDbAuditLog(log);
      const { error } = await supabase.from("audit_logs").upsert(dbRow);
      if (error) {
        handleSupabaseError("saving audit log", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception saving audit log:", e);
      return false;
    }
  },

  async clearAuditLogs(): Promise<boolean> {
    try {
      // In Supabase, delete all rows
      const { error } = await supabase.from("audit_logs").delete().neq("id", "");
      if (error) {
        handleSupabaseError("clearing audit logs", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Exception clearing audit logs:", e);
      return false;
    }
  },

  // --- Dynamic Migration ---
  async migrateLocalDataIfEmpty(): Promise<boolean> {
    try {
      const existingMembers = await this.getMembers();
      // If we could successfully query members, and the database has 0 members, let's migrate!
      if (existingMembers && existingMembers.length === 0) {
        console.log("Supabase is connected but empty. Initiating automatic migration of existing local storage data...");

        const localMembersStr = localStorage.getItem("smartsave_members");
        const localCollectionsStr = localStorage.getItem("smartsave_collections");
        const localSettingsStr = localStorage.getItem("smartsave_settings");
        const localEmployeesStr = localStorage.getItem("smartsave_employees");
        const localAttendanceStr = localStorage.getItem("smartsave_attendance");
        const localLoginHistoryStr = localStorage.getItem("smartsave_loginhistory");
        const localCommissionPaymentsStr = localStorage.getItem("smartsave_commission_payments");
        const localReminderHistoryStr = localStorage.getItem("smartsave_reminder_history");
        const localAuditLogsStr = localStorage.getItem("smartsave_auditlogs");

        const membersList = localMembersStr ? (JSON.parse(localMembersStr) as Member[]) : [];
        const collectionsList = localCollectionsStr ? (JSON.parse(localCollectionsStr) as Collection[]) : [];
        const settingsObj = localSettingsStr ? (JSON.parse(localSettingsStr) as CompanySettings) : null;
        const employeesList = localEmployeesStr ? (JSON.parse(localEmployeesStr) as Employee[]) : [];
        const attendanceList = localAttendanceStr ? (JSON.parse(localAttendanceStr) as AttendanceRecord[]) : [];
        const loginHistoryList = localLoginHistoryStr ? (JSON.parse(localLoginHistoryStr) as LoginHistoryRecord[]) : [];
        const commissionPaymentsList = localCommissionPaymentsStr ? (JSON.parse(localCommissionPaymentsStr) as CommissionPayment[]) : [];
        const reminderHistoryList = localReminderHistoryStr ? (JSON.parse(localReminderHistoryStr) as ReminderHistoryItem[]) : [];
        const auditLogsList = localAuditLogsStr ? (JSON.parse(localAuditLogsStr) as AuditLog[]) : [];

        // Save employees first (foreign key constraints on other tables)
        if (employeesList.length > 0) {
          const dbRows = employeesList.map(toDbEmployee);
          await supabase.from("employees").upsert(dbRows);
        }

        // Save members (referred by collections and reminder_history)
        if (membersList.length > 0) {
          const dbRows = membersList.map(toDbMember);
          await supabase.from("members").upsert(dbRows);
        }

        // Save collections
        if (collectionsList.length > 0) {
          const dbRows = collectionsList.map(toDbCollection);
          await supabase.from("collections").upsert(dbRows);
        }

        // Save attendance
        if (attendanceList.length > 0) {
          const dbRows = attendanceList.map(toDbAttendance);
          await supabase.from("attendance").upsert(dbRows);
        }

        // Save login history
        if (loginHistoryList.length > 0) {
          const dbRows = loginHistoryList.map(toDbLoginHistory);
          await supabase.from("login_history").upsert(dbRows);
        }

        // Save commission payments
        if (commissionPaymentsList.length > 0) {
          const dbRows = commissionPaymentsList.map(toDbCommissionPayment);
          await supabase.from("commission_payments").upsert(dbRows);
        }

        // Save reminder history
        if (reminderHistoryList.length > 0) {
          const dbRows = reminderHistoryList.map(toDbReminderHistory);
          await supabase.from("reminder_history").upsert(dbRows);
        }

        // Save audit logs
        if (auditLogsList.length > 0) {
          const dbRows = auditLogsList.map(toDbAuditLog);
          await supabase.from("audit_logs").upsert(dbRows);
        }

        // Save settings
        if (settingsObj) {
          await this.saveSettings(settingsObj);
        }

        console.log("Automatic data migration to Supabase completed successfully!");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Exception migrating local data to Supabase:", e);
      return false;
    }
  }
};
