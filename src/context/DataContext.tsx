import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Member,
  Collection,
  CompanySettings,
  AuditLog,
  FinancialSummary,
  Employee,
  AttendanceRecord,
  LoginHistoryRecord,
  CommissionPayment,
  ReminderHistoryItem,
} from "../types";
import { calculateFinancialSummary } from "../utils/finance";

interface DataContextType {
  members: Member[];
  collections: Collection[];
  settings: CompanySettings;
  auditLogs: AuditLog[];
  financialSummary: FinancialSummary;
  employees: Employee[];
  attendance: AttendanceRecord[];
  loginHistory: LoginHistoryRecord[];
  commissionPayments: CommissionPayment[];
  reminderHistory: ReminderHistoryItem[];
  addMember: (member: Omit<Member, "id">) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addMemberPlan: (
    memberId: string,
    dailyAmount: number,
    startDate?: string,
  ) => void;
  updateMemberPlanStatus: (
    memberId: string,
    planId: string,
    newStatus: "Active" | "Paused" | "Closed",
  ) => void;
  addCollection: (
    collection: Omit<Collection, "id" | "receiptNo">,
  ) => Collection;
  updateCollection: (id: string, collection: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;
  backupData: () => void;
  restoreData: (jsonString: string) => void;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  markAttendance: (
    employeeId: string,
    status: AttendanceRecord["status"],
    date?: string,
  ) => void;
  addLoginHistory: (
    record: Omit<LoginHistoryRecord, "id" | "timestamp">,
  ) => void;
  updateLogoutTime: (username: string) => void;
  addCommissionPayment: (
    payment: Omit<CommissionPayment, "id" | "timestamp">,
  ) => void;
  updateCommissionPayment: (
    id: string,
    updates: Partial<CommissionPayment>,
  ) => void;
  deleteCommissionPayment: (id: string) => void;
  addReminderHistoryItem: (item: Omit<ReminderHistoryItem, "id">) => void;
  logAudit: (
    action: string,
    details: string,
    module?: string,
    status?: string,
  ) => void;
  clearAuditLogs: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultSettings: CompanySettings = {
  companyName: "Smart Save Financial Systems",
  registrationNumber: "REG-2024-8899",
  address: "123 Financial Hub, Business Park, Phase 1, City Center",
  contactEmail: "support@smartsave.com",
  supportPhone: "+91 1800 123 4567",

  registrationFee: "2500",
  dailyDeposit: "127",
  memberSavings: "102",
  companyCollection: "25",
  bonusPercentage: "0",
  companyProfitPercentage: "0",
  planDuration: "180",
  employeeCommissionPerCollection: "5",

  // keep legacy fields to not break existing logic
  defaultDailyAmount: "127",
  companyCommission: "25",
  lateFeePenalty: "300",

  // New general settings defaults
  companyLogo: "",
  website: "https://www.smartsave.com",
  gstNumber: "29GGGGG1314R9Z6",

  // New financial settings defaults
  gracePeriod: "30",

  // New receipt settings defaults
  receiptPrefix: "RCT",
  receiptFooter:
    "Thank you for saving with Smart Save. Keep saving, keep growing!",
  companyStamp: "",
  authorizedSignature: "",
  autoReceiptNumber: true,

  // New user settings defaults
  adminUsername: "smartadmin",
  adminPassword: "Ani@2024",
  employeePasswordReset: "emp123",
  sessionTimeout: "15",

  // New backup settings defaults
  autoBackup: true,
  backupInterval: "Daily",

  // New notification settings defaults
  whatsappEnabled: true,
  smsEnabled: true,
  emailNotificationsEnabled: false,
  paymentReminderDays: "1",
  maturityReminderDays: "7",
};

const upgradeMembers = (rawMembers: any[]): Member[] => {
  return rawMembers.map((m: any) => {
    const upgraded = { ...m };
    if (!upgraded.registrationStatus) {
      upgraded.registrationStatus = "Verified";
    }
    if (!upgraded.planUnits) {
      upgraded.planUnits =
        Math.round(parseInt(upgraded.dailyAmount || "127", 10) / 127) || 1;
    }
    if (!upgraded.plans || upgraded.plans.length === 0) {
      upgraded.plans = Array.from({ length: upgraded.planUnits }, (_, idx) => ({
        id: `${upgraded.id}-PLAN-${idx + 1}`,
        dailyAmount: 127,
        status: upgraded.status === "Active" ? "Active" : "Closed",
        startDate: upgraded.joinDate || new Date().toISOString().split("T")[0],
      }));
    }
    return upgraded as Member;
  });
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Sync clean reset check before initial states run
  if (typeof window !== "undefined") {
    const isResetDone =
      localStorage.getItem("smartsave_clean_reset_done_v2") === "true";
    if (!isResetDone) {
      localStorage.removeItem("smartsave_members");
      localStorage.removeItem("smartsave_collections");
      localStorage.removeItem("smartsave_commission_payments");
      localStorage.removeItem("smartsave_auditlogs");
      localStorage.setItem("smartsave_clean_reset_done_v2", "true");
    }
  }

  const defaultEmployees: Employee[] = [];

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem("smartsave_members");
    const parsed = saved ? JSON.parse(saved) : [];
    return upgradeMembers(parsed);
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem("smartsave_collections");
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem("smartsave_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("smartsave_auditlogs");
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    let empList: Employee[] = [];
    const saved = localStorage.getItem("smartsave_employees");
    if (saved) {
      const parsed = JSON.parse(saved) as Employee[];
      empList = parsed.filter(
        (e) =>
          e.id !== "EMP001" &&
          e.id !== "EMP002" &&
          e.name !== "Rajesh Kumar" &&
          e.name !== "Sunita Sharma",
      );
    }

    const hasAdmin = empList.some(
      (e) => e.designation === "Super Admin" || e.username === "smartadmin",
    );
    if (!hasAdmin) {
      empList.push({
        id: "ADMIN001",
        name: "Super Admin",
        phone: "0000000000",
        email: "admin@smartsave.com",
        address: "System Administrator",
        aadhaar: "000000000000",
        designation: "Super Admin",
        branch: "Head Office",
        username: "smartadmin",
        password: "Ani@2024",
        dailyTarget: "0",
        monthlySalary: "0",
        commissionPercentage: "0",
        joinDate: new Date().toISOString().split("T")[0],
        status: "Active",
      });
    }

    return empList;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("smartsave_attendance");
    return saved ? JSON.parse(saved) : [];
  });

  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>(() => {
    const saved = localStorage.getItem("smartsave_loginhistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [commissionPayments, setCommissionPayments] = useState<
    CommissionPayment[]
  >(() => {
    const saved = localStorage.getItem("smartsave_commission_payments");
    return saved ? JSON.parse(saved) : [];
  });

  const [reminderHistory, setReminderHistory] = useState<ReminderHistoryItem[]>(
    () => {
      const saved = localStorage.getItem("smartsave_reminder_history");
      return saved ? JSON.parse(saved) : [];
    },
  );

  const financialSummary = React.useMemo(
    () => calculateFinancialSummary(collections, members, settings),
    [collections, members, settings],
  );

  useEffect(() => {
    localStorage.setItem("smartsave_members", JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem("smartsave_collections", JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem("smartsave_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("smartsave_auditlogs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("smartsave_employees", JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem("smartsave_attendance", JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(
      "smartsave_loginhistory",
      JSON.stringify(loginHistory),
    );
  }, [loginHistory]);

  useEffect(() => {
    localStorage.setItem(
      "smartsave_commission_payments",
      JSON.stringify(commissionPayments),
    );
  }, [commissionPayments]);

  useEffect(() => {
    localStorage.setItem(
      "smartsave_reminder_history",
      JSON.stringify(reminderHistory),
    );
  }, [reminderHistory]);

  const addAuditLog = (
    action: string,
    details: string,
    module?: string,
    status: string = "Success",
  ) => {
    const savedUser = localStorage.getItem("smartsave_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const username = currentUser?.username || currentUser?.name || "System";
    const role = currentUser?.role || "System";

    // Attempt to infer module if not provided
    let inferredModule = module || "System";
    if (!module) {
      if (
        action.includes("Login") ||
        action.includes("Logout") ||
        (action.includes("Password") && !action.includes("Reset"))
      )
        inferredModule = "Authentication";
      else if (action.includes("Member")) inferredModule = "Members";
      else if (action.includes("Employee") || action.includes("Reset"))
        inferredModule = "Employee Management";
      else if (action.includes("Settings") || action.includes("Backup"))
        inferredModule = "Settings";
      else if (action.includes("Collection") || action.includes("Receipt"))
        inferredModule = "Daily Collection";
      else if (action.includes("Reminder")) inferredModule = "Reminder Center";
      else if (action.includes("Profile")) inferredModule = "Profile";
    }

    setAuditLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        action,
        details,
        timestamp: new Date().toISOString(),
        username,
        role,
        module: inferredModule,
        status,
        ipAddress: "192.168.1." + Math.floor(Math.random() * 255), // Placeholder
        device: "Web Browser", // Placeholder
      },
      ...prev,
    ]);
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const addMember = (member: Omit<Member, "id">) => {
    const savedUser = localStorage.getItem("smartsave_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const registeredBy =
      currentUser?.role === "Employee" ? currentUser.memberId : "admin";
    const registeredByName =
      currentUser?.role === "Employee"
        ? currentUser.name || currentUser.username
        : "Admin";

    setMembers((prev) => {
      const maxId = prev.reduce((max, m) => {
        const cleanedId = m.id.replace("MEM-", "").replace("MEM", "");
        const num = parseInt(cleanedId, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = `MEM-${String(maxId + 1).padStart(3, "0")}`;
      const planUnits =
        member.planUnits ||
        Math.round(parseInt(member.dailyAmount || "127", 10) / 127) ||
        1;
      const generatedPlans = Array.from({ length: planUnits }, (_, idx) => ({
        id: `${newId}-PLAN-${idx + 1}`,
        dailyAmount: 127,
        status: "Active" as const,
        startDate: member.joinDate || new Date().toISOString().split("T")[0],
      }));
      const newMember = {
        ...member,
        id: newId,
        planUnits,
        dailyAmount: (planUnits * 127).toString(),
        registeredBy,
        registrationStatus: "Verified",
        plans: generatedPlans,
      } as Member;
      addAuditLog(
        "Create Member",
        `Created member ${newId} (${newMember.name})`,
      );

      // Auto-create Registration Fee collection
      setCollections((prevCols) => {
        const count = prevCols.length + 1;
        const prefix = settings?.receiptPrefix || "RCT";
        const newReceiptNo = `${prefix}${count.toString().padStart(4, "0")}-${Math.floor(
          Math.random() * 1000,
        )
          .toString()
          .padStart(3, "0")}`;
        const regFeeCollection: Collection = {
          id: Math.random().toString(36).substr(2, 9),
          receiptNo: newReceiptNo,
          memberId: newId,
          memberName: newMember.name,
          amount: settings.registrationFee || "2500",
          type: "Registration Fee",
          notes: "Auto-generated registration fee",
          timestamp: new Date().toISOString(),
          status: "Completed",
          collectedBy: registeredBy,
          collectedByName: registeredByName,
        };
        return [regFeeCollection, ...prevCols];
      });

      return [newMember, ...prev];
    });
  };

  const updateMember = (id: string, member: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...member };
        if (member.planUnits !== undefined) {
          const planUnits = member.planUnits;
          updated.dailyAmount = (planUnits * 127).toString();
          const currentPlans = m.plans || [];
          const activePlans = currentPlans.filter((p) => p.status === "Active");
          const nonActivePlans = currentPlans.filter(
            (p) => p.status !== "Active",
          );
          if (activePlans.length !== planUnits) {
            let newActivePlans = [...activePlans];
            if (activePlans.length < planUnits) {
              const needed = planUnits - activePlans.length;
              for (let i = 0; i < needed; i++) {
                const nextIdx = currentPlans.length + i + 1;
                newActivePlans.push({
                  id: `${id}-PLAN-${nextIdx}`,
                  dailyAmount: 127,
                  status: "Active",
                  startDate:
                    member.joinDate ||
                    m.joinDate ||
                    new Date().toISOString().split("T")[0],
                });
              }
            } else {
              newActivePlans = activePlans.slice(0, planUnits);
            }
            updated.plans = [...newActivePlans, ...nonActivePlans];
          }
        }
        return updated;
      }),
    );
    addAuditLog("Update Member", `Updated member details for ${id}`);
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setCollections((prev) => prev.filter((c) => c.memberId !== id));
    addAuditLog("Delete Member", `Deleted member ${id} and their collections`);
  };

  const addMemberPlan = (
    memberId: string,
    dailyAmount: number,
    startDate?: string,
  ) => {
    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== memberId) return m;
        const currentPlans = m.plans || [
          {
            id: `${m.id}-PLAN-1`,
            dailyAmount: parseInt(m.dailyAmount || "127", 10),
            status: m.status === "Active" ? "Active" : "Closed",
            startDate: m.joinDate,
          },
        ];
        const nextIdx = currentPlans.length + 1;
        const newPlan = {
          id: `${m.id}-PLAN-${nextIdx}`,
          dailyAmount,
          status: "Active" as const,
          startDate: startDate || new Date().toISOString().split("T")[0],
        };
        const updatedPlans = [...currentPlans, newPlan];
        const activePlans = updatedPlans.filter((p) => p.status === "Active");
        const totalDaily = activePlans.reduce(
          (sum, p) => sum + p.dailyAmount,
          0,
        );

        return {
          ...m,
          plans: updatedPlans,
          dailyAmount: totalDaily.toString(),
          planUnits: Math.round(totalDaily / 127) || 1,
          status: (activePlans.length > 0 ? "Active" : "Inactive") as
            "Active" | "Inactive",
        };
      });
      addAuditLog(
        "Add Plan",
        `Added ${dailyAmount} Plan to Member ${memberId}`,
      );
      return updated;
    });
  };

  const updateMemberPlanStatus = (
    memberId: string,
    planId: string,
    newStatus: "Active" | "Paused" | "Closed",
  ) => {
    setMembers((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== memberId) return m;
        const currentPlans = m.plans || [
          {
            id: `${m.id}-PLAN-1`,
            dailyAmount: parseInt(m.dailyAmount || "127", 10),
            status: m.status === "Active" ? "Active" : "Closed",
            startDate: m.joinDate,
          },
        ];
        const updatedPlans = currentPlans.map((p) => {
          if (p.id !== planId) return p;
          return { ...p, status: newStatus };
        });
        const activePlans = updatedPlans.filter((p) => p.status === "Active");
        const totalDaily = activePlans.reduce(
          (sum, p) => sum + p.dailyAmount,
          0,
        );

        return {
          ...m,
          plans: updatedPlans,
          dailyAmount: totalDaily.toString(),
          planUnits: Math.round(totalDaily / 127) || 1,
          status: (activePlans.length > 0 ? "Active" : "Inactive") as
            "Active" | "Inactive",
        };
      });
      addAuditLog(
        "Update Plan Status",
        `Plan ${planId} of Member ${memberId} changed status to ${newStatus}`,
      );
      return updated;
    });
  };

  const addCollection = (
    collection: Omit<Collection, "id" | "receiptNo">,
  ): Collection => {
    const savedUser = localStorage.getItem("smartsave_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const collectedBy =
      currentUser?.role === "Employee" ? currentUser.memberId : "admin";
    const collectedByName =
      currentUser?.role === "Employee"
        ? currentUser.name || currentUser.username
        : "Admin";

    const idStr = Math.random().toString(36).substr(2, 9);
    const count = collections.length + 1;
    const prefix = settings?.receiptPrefix || "RCT";
    const newReceiptNo = `${prefix}${count.toString().padStart(4, "0")}-${Math.floor(
      Math.random() * 1000,
    )
      .toString()
      .padStart(3, "0")}`;
    const newCollection: Collection = {
      ...collection,
      id: idStr,
      receiptNo: newReceiptNo,
      collectedBy,
      collectedByName,
    } as Collection;

    setCollections((prev) => {
      return [newCollection, ...prev];
    });

    addAuditLog(
      "Add Collection",
      `Added collection ${newReceiptNo} for member ${collection.memberId}`,
    );

    if (collectedBy !== "admin") {
      const commRate = settings.employeeCommissionPerCollection || "5";
      addAuditLog(
        "Commission Calculated",
        `Calculated commission of ₹${commRate} for collection ${newReceiptNo} by employee ${collectedByName} (${collectedBy})`,
      );
    }

    return newCollection;
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
    addAuditLog("Update Collection", `Updated collection ${id}`);
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== id));
    addAuditLog("Delete Collection", `Deleted collection ${id}`);
  };

  const addEmployee = (employee: Omit<Employee, "id">) => {
    setEmployees((prev) => {
      const maxId = prev.reduce((max, e) => {
        const num = parseInt(e.id.replace("EMP", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = `EMP${String(maxId + 1).padStart(3, "0")}`;
      const newEmployee = { ...employee, id: newId } as Employee;
      addAuditLog(
        "Create Employee",
        `Created employee ${newId} (${newEmployee.name})`,
      );
      return [newEmployee, ...prev];
    });
  };

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...employee } : e)),
    );
    addAuditLog("Update Employee", `Updated employee details for ${id}`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addAuditLog("Delete Employee", `Deleted employee ${id}`);
  };

  const markAttendance = (
    employeeId: string,
    status: AttendanceRecord["status"],
    date?: string,
  ) => {
    const dateStr = date || new Date().toISOString().split("T")[0];
    setAttendance((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.employeeId === employeeId && a.date === dateStr,
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], status };
        return updated;
      } else {
        const newRecord: AttendanceRecord = {
          id: Math.random().toString(36).substr(2, 9),
          employeeId,
          date: dateStr,
          status,
          checkIn:
            status === "Present" ? new Date().toLocaleTimeString() : undefined,
        };
        return [newRecord, ...prev];
      }
    });
    addAuditLog(
      "Mark Attendance",
      `Marked attendance for ${employeeId} on ${dateStr} as ${status}`,
    );
  };

  const addLoginHistory = (
    record: Omit<LoginHistoryRecord, "id" | "timestamp">,
  ) => {
    const newRecord: LoginHistoryRecord = {
      ...record,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ipAddress:
        record.ipAddress || "192.168.1." + Math.floor(Math.random() * 254 + 1),
      device:
        record.device ||
        (navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"),
    };
    setLoginHistory((prev) => [newRecord, ...prev]);
  };

  const updateLogoutTime = (username: string) => {
    setLoginHistory((prev) => {
      const newHistory = [...prev];
      const idx = newHistory.findIndex(
        (r) =>
          r.username === username && !r.logoutTime && r.status === "Successful",
      );
      if (idx !== -1) {
        newHistory[idx] = {
          ...newHistory[idx],
          logoutTime: new Date().toISOString(),
        };
      }
      return newHistory;
    });
  };

  const updateSettings = (updates: Partial<CompanySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    addAuditLog("Update Settings", `Updated company settings`);
  };

  const backupData = () => {
    const data = {
      members,
      collections,
      settings,
      auditLogs,
      employees,
      attendance,
      loginHistory,
      commissionPayments,
      reminderHistory,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartsave-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditLog("Backup Data", `Downloaded data backup`);
  };

  const restoreData = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.members && Array.isArray(parsed.members)) {
        setMembers(upgradeMembers(parsed.members));
      }
      if (parsed.collections && Array.isArray(parsed.collections)) {
        setCollections(parsed.collections);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      if (parsed.auditLogs && Array.isArray(parsed.auditLogs)) {
        setAuditLogs(parsed.auditLogs);
      }
      if (parsed.employees && Array.isArray(parsed.employees)) {
        setEmployees(parsed.employees);
      }
      if (parsed.attendance && Array.isArray(parsed.attendance)) {
        setAttendance(parsed.attendance);
      }
      if (parsed.loginHistory && Array.isArray(parsed.loginHistory)) {
        setLoginHistory(parsed.loginHistory);
      }
      if (
        parsed.commissionPayments &&
        Array.isArray(parsed.commissionPayments)
      ) {
        setCommissionPayments(parsed.commissionPayments);
      }
      if (parsed.reminderHistory && Array.isArray(parsed.reminderHistory)) {
        setReminderHistory(parsed.reminderHistory);
      }
      addAuditLog("Restore Data", `Restored data from backup`);
    } catch (e) {
      alert("Invalid backup file");
    }
  };

  const addCommissionPayment = (
    payment: Omit<CommissionPayment, "id" | "timestamp">,
  ) => {
    const newPayment: CommissionPayment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setCommissionPayments((prev) => [newPayment, ...prev]);
    addAuditLog(
      "Commission Paid",
      `Recorded commission payment of ₹${payment.amount} for employee ${payment.employeeName} (${payment.employeeId})`,
    );
  };

  const updateCommissionPayment = (
    id: string,
    updates: Partial<CommissionPayment>,
  ) => {
    setCommissionPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          const detailsStr =
            updates.status === "Paid" ? "marked as Paid" : "marked as Pending";
          addAuditLog(
            "Commission Updated",
            `Commission payment ${id} for ${updated.employeeName} was ${detailsStr}`,
          );
          return updated;
        }
        return p;
      }),
    );
  };

  const deleteCommissionPayment = (id: string) => {
    const p = commissionPayments.find((x) => x.id === id);
    setCommissionPayments((prev) => prev.filter((x) => x.id !== id));
    addAuditLog(
      "Commission Updated",
      `Deleted commission record ${id} for ${p?.employeeName || "unknown"}`,
    );
  };

  const addReminderHistoryItem = (item: Omit<ReminderHistoryItem, "id">) => {
    const newItem: ReminderHistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
    };
    setReminderHistory((prev) => [newItem, ...prev]);
    addAuditLog(
      "Sent Reminder",
      `Sent reminder to member ${item.memberName} (${item.memberId}) with outstanding amount ₹${item.dueAmount}`,
    );
  };

  return (
    <DataContext.Provider
      value={{
        members,
        collections,
        settings,
        auditLogs,
        financialSummary,
        employees,
        attendance,
        loginHistory,
        commissionPayments,
        addMember,
        updateMember,
        deleteMember,
        addMemberPlan,
        updateMemberPlanStatus,
        addCollection,
        updateCollection,
        deleteCollection,
        updateSettings,
        backupData,
        restoreData,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        markAttendance,
        addLoginHistory,
        updateLogoutTime,
        addCommissionPayment,
        updateCommissionPayment,
        deleteCommissionPayment,
        reminderHistory,
        addReminderHistoryItem,
        logAudit: addAuditLog,
        clearAuditLogs,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
