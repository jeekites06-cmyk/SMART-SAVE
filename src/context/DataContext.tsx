import React, { createContext, useContext, useState, useEffect } from "react";
import { Member, Collection, CompanySettings, AuditLog, FinancialSummary, Employee, AttendanceRecord, LoginHistoryRecord, CommissionPayment } from "../types";
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
  addMember: (member: Omit<Member, "id">) => void;
  updateMember: (id: string, member: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addCollection: (collection: Omit<Collection, "id" | "receiptNo">) => Collection;
  updateCollection: (id: string, collection: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  updateSettings: (settings: Partial<CompanySettings>) => void;
  backupData: () => void;
  restoreData: (jsonString: string) => void;
  addEmployee: (employee: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  markAttendance: (employeeId: string, status: AttendanceRecord["status"], date?: string) => void;
  addLoginHistory: (employeeId: string) => void;
  addCommissionPayment: (payment: Omit<CommissionPayment, "id" | "timestamp">) => void;
  updateCommissionPayment: (id: string, updates: Partial<CommissionPayment>) => void;
  deleteCommissionPayment: (id: string) => void;
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
  bonusPercentage: "60",
  companyProfitPercentage: "40",
  planDuration: "180",
  employeeCommissionPerCollection: "5",
  
  // keep legacy fields to not break existing logic
  defaultDailyAmount: "127",
  companyCommission: "25",
  lateFeePenalty: "50",

  // New general settings defaults
  companyLogo: "",
  website: "https://www.smartsave.com",
  gstNumber: "29GGGGG1314R9Z6",

  // New financial settings defaults
  gracePeriod: "5",

  // New receipt settings defaults
  receiptPrefix: "RCT",
  receiptFooter: "Thank you for saving with Smart Save. Keep saving, keep growing!",
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Sync clean reset check before initial states run
  if (typeof window !== "undefined") {
    const isResetDone = localStorage.getItem("smartsave_clean_reset_done_v2") === "true";
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
    return saved ? JSON.parse(saved) : [];
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem("smartsave_collections");
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem("smartsave_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.adminUsername !== "smartadmin" || parsed.adminPassword !== "Ani@2024") {
        parsed.adminUsername = "smartadmin";
        parsed.adminPassword = "Ani@2024";
        localStorage.setItem("smartsave_settings", JSON.stringify(parsed));
      }
      return parsed;
    }
    return defaultSettings;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("smartsave_auditlogs");
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem("smartsave_employees");
    if (saved) {
      const parsed = JSON.parse(saved) as Employee[];
      return parsed.filter(
        (e) =>
          e.id !== "EMP001" &&
          e.id !== "EMP002" &&
          e.name !== "Rajesh Kumar" &&
          e.name !== "Sunita Sharma"
      );
    }
    return [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem("smartsave_attendance");
    return saved ? JSON.parse(saved) : [];
  });

  const [loginHistory, setLoginHistory] = useState<LoginHistoryRecord[]>(() => {
    const saved = localStorage.getItem("smartsave_loginhistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>(() => {
    const saved = localStorage.getItem("smartsave_commission_payments");
    return saved ? JSON.parse(saved) : [];
  });

  const financialSummary = React.useMemo(() => calculateFinancialSummary(collections, members, settings), [collections, members, settings]);

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
    localStorage.setItem("smartsave_loginhistory", JSON.stringify(loginHistory));
  }, [loginHistory]);

  useEffect(() => {
    localStorage.setItem("smartsave_commission_payments", JSON.stringify(commissionPayments));
  }, [commissionPayments]);

  const addAuditLog = (action: string, details: string) => {
    setAuditLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        action,
        details,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const addMember = (member: Omit<Member, "id">) => {
    const savedUser = localStorage.getItem("smartsave_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const registeredBy = currentUser?.role === "Employee" ? currentUser.memberId : "admin";
    const registeredByName = currentUser?.role === "Employee" ? (currentUser.name || currentUser.username) : "Admin";

    setMembers((prev) => {
      const maxId = prev.reduce((max, m) => {
        const num = parseInt(m.id.replace("MEM-", ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = `MEM-${String(maxId + 1).padStart(3, "0")}`;
      const newMember = { ...member, id: newId, registeredBy } as Member;
      addAuditLog("Create Member", `Created member ${newId} (${newMember.name})`);
      
      // Auto-create Registration Fee collection
      setCollections((prevCols) => {
        const count = prevCols.length + 1;
        const prefix = settings?.receiptPrefix || "RCT";
        const newReceiptNo = `${prefix}${count.toString().padStart(4, "0")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
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
      prev.map((m) => (m.id === id ? { ...m, ...member } : m))
    );
    addAuditLog("Update Member", `Updated member details for ${id}`);
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setCollections((prev) => prev.filter((c) => c.memberId !== id));
    addAuditLog("Delete Member", `Deleted member ${id} and their collections`);
  };

  const addCollection = (collection: Omit<Collection, "id" | "receiptNo">): Collection => {
    const savedUser = localStorage.getItem("smartsave_user");
    const currentUser = savedUser ? JSON.parse(savedUser) : null;
    const collectedBy = currentUser?.role === "Employee" ? currentUser.memberId : "admin";
    const collectedByName = currentUser?.role === "Employee" ? (currentUser.name || currentUser.username) : "Admin";

    const idStr = Math.random().toString(36).substr(2, 9);
    const count = collections.length + 1;
    const prefix = settings?.receiptPrefix || "RCT";
    const newReceiptNo = `${prefix}${count.toString().padStart(4, "0")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
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
    
    addAuditLog("Add Collection", `Added collection ${newReceiptNo} for member ${collection.memberId}`);

    if (collectedBy !== "admin") {
      const commRate = settings.employeeCommissionPerCollection || "5";
      addAuditLog("Commission Calculated", `Calculated commission of ₹${commRate} for collection ${newReceiptNo} by employee ${collectedByName} (${collectedBy})`);
    }

    return newCollection;
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
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
      addAuditLog("Create Employee", `Created employee ${newId} (${newEmployee.name})`);
      return [newEmployee, ...prev];
    });
  };

  const updateEmployee = (id: string, employee: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...employee } : e))
    );
    addAuditLog("Update Employee", `Updated employee details for ${id}`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    addAuditLog("Delete Employee", `Deleted employee ${id}`);
  };

  const markAttendance = (employeeId: string, status: AttendanceRecord["status"], date?: string) => {
    const dateStr = date || new Date().toISOString().split("T")[0];
    setAttendance((prev) => {
      const existingIdx = prev.findIndex((a) => a.employeeId === employeeId && a.date === dateStr);
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
          checkIn: status === "Present" ? new Date().toLocaleTimeString() : undefined,
        };
        return [newRecord, ...prev];
      }
    });
    addAuditLog("Mark Attendance", `Marked attendance for ${employeeId} on ${dateStr} as ${status}`);
  };

  const addLoginHistory = (employeeId: string) => {
    const newRecord: LoginHistoryRecord = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId,
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1." + Math.floor(Math.random() * 254 + 1),
      device: navigator.userAgent.includes("Mobile") ? "Mobile (Android)" : "Desktop (Chrome/Windows)",
    };
    setLoginHistory((prev) => [newRecord, ...prev]);
    addAuditLog("Employee Login", `Employee ${employeeId} logged in`);
  };

  const updateSettings = (updates: Partial<CompanySettings>) => {
    const safeUpdates = { ...updates };
    if (safeUpdates.adminUsername) safeUpdates.adminUsername = "smartadmin";
    if (safeUpdates.adminPassword) safeUpdates.adminPassword = "Ani@2024";
    setSettings((prev) => ({ ...prev, ...safeUpdates }));
    addAuditLog("Update Settings", `Updated company settings`);
  };

  const backupData = () => {
    const data = { members, collections, settings, auditLogs, employees, attendance, loginHistory, commissionPayments };
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
        setMembers(parsed.members);
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
      if (parsed.commissionPayments && Array.isArray(parsed.commissionPayments)) {
        setCommissionPayments(parsed.commissionPayments);
      }
      addAuditLog("Restore Data", `Restored data from backup`);
    } catch (e) {
      alert("Invalid backup file");
    }
  };

  const addCommissionPayment = (payment: Omit<CommissionPayment, "id" | "timestamp">) => {
    const newPayment: CommissionPayment = {
      ...payment,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    setCommissionPayments((prev) => [newPayment, ...prev]);
    addAuditLog("Commission Paid", `Recorded commission payment of ₹${payment.amount} for employee ${payment.employeeName} (${payment.employeeId})`);
  };

  const updateCommissionPayment = (id: string, updates: Partial<CommissionPayment>) => {
    setCommissionPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          const detailsStr = updates.status === "Paid" ? "marked as Paid" : "marked as Pending";
          addAuditLog("Commission Updated", `Commission payment ${id} for ${updated.employeeName} was ${detailsStr}`);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteCommissionPayment = (id: string) => {
    const p = commissionPayments.find((x) => x.id === id);
    setCommissionPayments((prev) => prev.filter((x) => x.id !== id));
    addAuditLog("Commission Updated", `Deleted commission record ${id} for ${p?.employeeName || "unknown"}`);
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
        addCommissionPayment,
        updateCommissionPayment,
        deleteCommissionPayment,
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

