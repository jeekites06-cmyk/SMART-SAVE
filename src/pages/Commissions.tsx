import React, { useState, useMemo } from "react";
import {
  DollarSign,
  User,
  Calendar,
  Filter,
  Download,
  Printer,
  Plus,
  CheckCircle,
  Clock,
  History,
  Trash2,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  Coins,
  MapPin,
  Briefcase,
  Smartphone,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Commissions() {
  const {
    employees,
    collections,
    members,
    commissionPayments,
    addCommissionPayment,
    updateCommissionPayment,
    deleteCommissionPayment,
    settings,
    auditLogs
  } = useData();

  const { user } = useAuth();
  const isAdmin = user?.role === "Super Admin" || user?.role === "Administrator";
  const loggedInEmployeeId = user?.role === "Employee" ? user.memberId : "";

  // Success Notification state
  const [successMsg, setSuccessMsg] = useState("");
  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Helper date markers
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

  // Helper calculation formulas for collections
  const getCollectionCommission = (col: any) => {
    if (col.type === "Registration Fee" || !col.collectedBy || col.collectedBy === "admin") {
      return 0;
    }
    return Number(settings?.employeeCommissionPerCollection || 5);
  };

  const getRegistrationCommissionForMember = (m: any) => {
    if (!m.registeredBy || m.registeredBy === "admin") return 0;
    const emp = employees.find((e) => e.id === m.registeredBy);
    return Number(emp?.registrationCommission || 0);
  };

  // --- 1. CORE COMPILATION OF RAW TRANSACTION ROWS ---
  const commissionRows = useMemo(() => {
    const rows: any[] = [];

    // Add collections
    collections.forEach((c) => {
      if (c.type !== "Registration Fee" && c.collectedBy && c.collectedBy !== "admin") {
        const emp = employees.find((e) => e.id === c.collectedBy);
        const mName = members.find((mb) => mb.id === c.memberId)?.name || c.memberId;
        rows.push({
          id: `col-${c.id}`,
          type: "Daily Collection",
          employeeId: c.collectedBy,
          employeeName: emp?.name || c.collectedByName || "Employee",
          memberId: c.memberId,
          memberName: mName,
          amount: Number(c.amount || 0),
          commission: getCollectionCommission(c),
          date: c.timestamp.split("T")[0],
          time: c.timestamp.includes("T") ? c.timestamp.split("T")[1].substring(0, 5) : "00:00",
          rawTimestamp: c.timestamp
        });
      }
    });

    // Add registration fees
    members.forEach((m) => {
      if (m.registeredBy && m.registeredBy !== "admin") {
        const emp = employees.find((e) => e.id === m.registeredBy);
        rows.push({
          id: `reg-${m.id}`,
          type: "New Member Registration",
          employeeId: m.registeredBy,
          employeeName: emp?.name || "Employee",
          memberId: m.id,
          memberName: m.name,
          amount: Number(settings?.registrationFee || 2500),
          commission: getRegistrationCommissionForMember(m),
          date: m.joinDate,
          time: "10:00",
          rawTimestamp: `${m.joinDate}T10:00:00.000Z`
        });
      }
    });

    // Sort by date descending
    rows.sort((a, b) => b.rawTimestamp.localeCompare(a.rawTimestamp));
    return rows;
  }, [collections, members, employees, settings]);


  // --- 2. CALCULATE EMPLOYEE AGGREGATED METRICS (REGISTER DATA) ---
  const employeeStatsList = useMemo(() => {
    return employees.map((emp) => {
      // Members Managed by this employee
      const managedMembers = members.filter((m) => m.registeredBy === emp.id);
      const membersCount = managedMembers.length;

      // Collections collected by this employee
      const empCollections = collections.filter(
        (c) => c.collectedBy === emp.id && c.type !== "Registration Fee"
      );
      const collectionsCount = empCollections.length;
      const collectionsSum = empCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);

      // Total Commission Earned (collections commission + registration commission)
      const collectionsCommission = empCollections.reduce((sum, c) => sum + getCollectionCommission(c), 0);
      const registrationsCommission = managedMembers.reduce(
        (sum, m) => sum + Number(emp.registrationCommission || 0),
        0
      );
      const commissionEarned = collectionsCommission + registrationsCommission;

      // Commission Paid
      const commissionPaid = (commissionPayments || [])
        .filter((p) => p.employeeId === emp.id && p.status === "Paid")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Pending Commission
      const pendingCommission = commissionEarned - commissionPaid;

      // Status indicator based on payment state
      const commissionStatus = pendingCommission <= 0 ? "Paid" : "Pending";

      return {
        ...emp,
        membersCount,
        collectionsCount,
        collectionsSum,
        commissionEarned,
        commissionPaid,
        pendingCommission,
        commissionStatus
      };
    });
  }, [employees, collections, members, commissionPayments, settings]);


  // --- 3. FILTER STATES FOR REGISTER TABLE ---
  const [registerSearchQuery, setRegisterSearchQuery] = useState("");
  const [registerFilterStatus, setRegisterFilterStatus] = useState("All"); // All, Active, Inactive, Paid, Pending
  const [registerFilterBranch, setRegisterFilterBranch] = useState("All");

  // Filtered employees for the main list
  const filteredRegisterEmployees = useMemo(() => {
    return employeeStatsList.filter((emp) => {
      // If employee, only show themselves
      if (!isAdmin && loggedInEmployeeId && emp.id !== loggedInEmployeeId) {
        return false;
      }

      // Search (Name, ID, Phone)
      const query = registerSearchQuery.toLowerCase().trim();
      if (query) {
        const matches =
          emp.name.toLowerCase().includes(query) ||
          emp.id.toLowerCase().includes(query) ||
          emp.phone.includes(query);
        if (!matches) return false;
      }

      // Filter: Status
      if (registerFilterStatus === "Active" && emp.status !== "Active") return false;
      if (registerFilterStatus === "Inactive" && emp.status !== "Inactive") return false;
      if (registerFilterStatus === "Paid" && emp.pendingCommission > 0) return false;
      if (registerFilterStatus === "Pending" && emp.pendingCommission <= 0) return false;

      // Filter: Branch
      if (registerFilterBranch !== "All" && emp.branch !== registerFilterBranch) return false;

      return true;
    });
  }, [employeeStatsList, registerSearchQuery, registerFilterStatus, registerFilterBranch, isAdmin, loggedInEmployeeId]);

  // Unique branches list for dropdown
  const uniqueBranches = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.branch).filter(Boolean)));
  }, [employees]);


  // --- 4. CALCULATE DASHBOARD METRICS ---
  // If employee is logged in, show their stats, otherwise show aggregated totals
  const activeEmployeeIdForMetrics = isAdmin ? "" : loggedInEmployeeId;

  const todayEarned = useMemo(() => {
    return commissionRows
      .filter((row) => (!activeEmployeeIdForMetrics || row.employeeId === activeEmployeeIdForMetrics) && row.date === todayStr)
      .reduce((sum, r) => sum + r.commission, 0);
  }, [commissionRows, todayStr, activeEmployeeIdForMetrics]);

  const monthlyEarned = useMemo(() => {
    return commissionRows
      .filter((row) => (!activeEmployeeIdForMetrics || row.employeeId === activeEmployeeIdForMetrics) && row.date.startsWith(currentMonthStr))
      .reduce((sum, r) => sum + r.commission, 0);
  }, [commissionRows, currentMonthStr, activeEmployeeIdForMetrics]);

  const totalPaidCommission = useMemo(() => {
    return (commissionPayments || [])
      .filter((p) => !activeEmployeeIdForMetrics || p.employeeId === activeEmployeeIdForMetrics)
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [commissionPayments, activeEmployeeIdForMetrics]);

  const totalEarnedCommission = useMemo(() => {
    return employeeStatsList
      .filter((emp) => !activeEmployeeIdForMetrics || emp.id === activeEmployeeIdForMetrics)
      .reduce((sum, emp) => sum + emp.commissionEarned, 0);
  }, [employeeStatsList, activeEmployeeIdForMetrics]);

  const totalPendingCommission = useMemo(() => {
    return Math.max(0, totalEarnedCommission - totalPaidCommission);
  }, [totalEarnedCommission, totalPaidCommission]);

  const totalEmployeesCount = useMemo(() => {
    return employees.length;
  }, [employees]);

  const activeCollectorsCount = useMemo(() => {
    return employees.filter((e) => e.status === "Active").length;
  }, [employees]);


  // --- 5. DETAILED MODAL STATES & LOGIC ---
  const [selectedDetailsEmployeeId, setSelectedDetailsEmployeeId] = useState<string | null>(null);

  const detailsEmp = useMemo(() => {
    if (!selectedDetailsEmployeeId) return null;
    return employeeStatsList.find((e) => e.id === selectedDetailsEmployeeId);
  }, [selectedDetailsEmployeeId, employeeStatsList]);

  // Payment Form States
  const [payEmpId, setPayEmpId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payPeriod, setPayPeriod] = useState(currentMonthStr); // YYYY-MM
  const [payStatus, setPayStatus] = useState<"Paid" | "Pending">("Paid");
  const [payDate, setPayDate] = useState(todayStr);
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);

  // Helper to format Period/Cycle beautifully
  const formatPeriod = (periodStr?: string) => {
    if (!periodStr) return "N/A";
    const [year, month] = periodStr.split("-");
    if (!year || !month) return periodStr;
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  // Handle Record Payment Form submission (with duplicate safety validation)
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId) {
      alert("Please select an employee.");
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    if (!payPeriod) {
      alert("Please specify the commission cycle period.");
      return;
    }

    const emp = employees.find((x) => x.id === payEmpId);
    if (!emp) return;

    // Safety constraint: Prevent duplicate commission payments for the same commission cycle
    const alreadyPaid = (commissionPayments || []).some(
      (p) =>
        p.employeeId === payEmpId &&
        p.status === "Paid" &&
        p.period === payPeriod
    );

    if (alreadyPaid) {
      alert("Commission has already been paid for this period.");
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Confirm Recording Payment:\n\n` +
      `Employee: ${emp.name} (${emp.id})\n` +
      `Amount: ₹${Number(payAmount).toLocaleString()}\n` +
      `Period: ${formatPeriod(payPeriod)}\n` +
      `Status: ${payStatus}\n\n` +
      `Do you want to proceed?`
    );

    if (!confirmed) return;

    // Add payment history
    addCommissionPayment({
      employeeId: payEmpId,
      employeeName: emp.name,
      amount: Number(payAmount),
      status: payStatus,
      paymentDate: payDate,
      referenceNumber: payRef,
      remarks: payRemarks,
      period: payPeriod
    });

    showNotification(`Successfully recorded ₹${payAmount} payout for ${emp.name} [Period: ${formatPeriod(payPeriod)}]`);
    
    // Reset Form
    setPayEmpId("");
    setPayAmount("");
    setPayRef("");
    setPayRemarks("");
    setPayPeriod(currentMonthStr);
    setShowPayForm(false);
  };

  // Quick payout function from inside details modal
  const handleQuickPayout = (employeeId: string, pendingAmt: number) => {
    setPayEmpId(employeeId);
    setPayAmount(Math.max(0, pendingAmt).toString());
    setPayPeriod(currentMonthStr);
    setPayStatus("Paid");
    setPayDate(todayStr);
    setPayRef("");
    setPayRemarks(`Direct disburse from profile view`);
    setShowPayForm(true);
  };


  // --- 6. EXPORT HANDLERS ---
  // A. Export Commission Register
  const exportRegisterPDF = () => {
    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text("SMART SAVE - Employee Commission Register", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Filters - Status: ${registerFilterStatus}, Branch: ${registerFilterBranch}`, 14, 32);

    const headers = [["Employee ID", "Employee Name", "Phone", "Branch", "Designation", "Members Managed", "Collections (Count)", "Commission Earned (INR)", "Commission Paid (INR)", "Pending Commission (INR)", "Status"]];
    const data = filteredRegisterEmployees.map((r) => [
      r.id,
      r.name,
      r.phone,
      r.branch,
      r.designation,
      r.membersCount,
      `${r.collectionsCount} (Rs ${r.collectionsSum.toLocaleString()})`,
      r.commissionEarned,
      r.commissionPaid,
      r.pendingCommission,
      r.status
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 38,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.save(`commission-register-${todayStr}.pdf`);
  };

  const exportRegisterExcel = () => {
    const dataToExport = filteredRegisterEmployees.map((r) => ({
      "Employee ID": r.id,
      "Employee Name": r.name,
      "Mobile Number": r.phone,
      "Branch": r.branch,
      "Designation": r.designation,
      "Members Managed": r.membersCount,
      "Collections count": r.collectionsCount,
      "Collections sum (Rs)": r.collectionsSum,
      "Commission Earned (Rs)": r.commissionEarned,
      "Commission Paid (Rs)": r.commissionPaid,
      "Pending Commission (Rs)": r.pendingCommission,
      "Profile Status": r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission Register");
    XLSX.writeFile(workbook, `commission-register-${todayStr}.xlsx`);
  };

  // B. Export Commission Payment History
  const exportHistoryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text("SMART SAVE - Commission Payment History Ledger", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);

    const headers = [["Payment ID", "Date", "Employee ID", "Employee Name", "Period/Cycle", "Amount Paid (INR)", "Ref Number", "Status"]];
    const data = (commissionPayments || []).map((pay) => [
      pay.id,
      pay.paymentDate,
      pay.employeeId,
      pay.employeeName,
      pay.period ? formatPeriod(pay.period) : "N/A",
      pay.amount,
      pay.referenceNumber || "N/A",
      pay.status
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 32,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.save(`commission-history-${todayStr}.pdf`);
  };

  const exportHistoryExcel = () => {
    const dataToExport = (commissionPayments || []).map((pay) => ({
      "Payment ID": pay.id,
      "Payment Date": pay.paymentDate,
      "Employee ID": pay.employeeId,
      "Employee Name": pay.employeeName,
      "Period": pay.period ? formatPeriod(pay.period) : "N/A",
      "Amount Paid (Rs)": pay.amount,
      "Reference Number": pay.referenceNumber || "",
      "Remarks": pay.remarks || "",
      "Status": pay.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission Payment History");
    XLSX.writeFile(workbook, `commission-history-${todayStr}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Audit Logs for commissions specifically
  const commissionAudits = (auditLogs || []).filter(
    (log) =>
      log.action === "Commission Calculated" ||
      log.action === "Commission Paid" ||
      log.action === "Commission Updated"
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SMART SAVE Commissions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track daily collection incentives, manage premium collector performance, and disburse secure incentive payouts.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => {
                setShowPayForm(!showPayForm);
                setPayEmpId("");
                setPayAmount("");
              }}
              className="bg-[#003366] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#004080] transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Record Payout
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-4 print:hidden">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Record Payout Form Modal/Panel */}
      {showPayForm && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in duration-200 print:hidden">
          <div className="bg-[#003366] px-6 py-4 text-white flex justify-between items-center">
            <div>
              <h3 className="font-bold text-base">Record Commission Payout</h3>
              <p className="text-xs text-blue-100 mt-0.5">Disburse pending collection commissions to employee profiles securely.</p>
            </div>
            <button 
              onClick={() => setShowPayForm(false)}
              className="text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleRecordPayment} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Employee *</label>
              <select
                required
                value={payEmpId}
                onChange={(e) => {
                  const empId = e.target.value;
                  setPayEmpId(empId);
                  // Auto-populate pending commission as default amount
                  const found = employeeStatsList.find((x) => x.id === empId);
                  if (found) {
                    setPayAmount(Math.max(0, found.pendingCommission).toString());
                  }
                }}
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commission Cycle / Period *</label>
              <input
                required
                type="month"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Cycle to pay (e.g. {formatPeriod(payPeriod)})</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Amount (₹) *</label>
              <input
                required
                type="number"
                min="0.01"
                step="any"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="e.g. 250"
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status *</label>
              <select
                required
                value={payStatus}
                onChange={(e) => setPayStatus(e.target.value as "Paid" | "Pending")}
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              >
                <option value="Paid">Paid (Mark Disbursed)</option>
                <option value="Pending">Pending (Reserve)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Date *</label>
              <input
                required
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference Number</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="UPI Ref, Cheque No, Bank Trx"
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks / Payment Notes</label>
              <input
                type="text"
                value={payRemarks}
                onChange={(e) => setPayRemarks(e.target.value)}
                placeholder="Add special conditions or transaction remarks..."
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPayForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
              >
                Disburse Payout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Dashboard Cards Grid (6 Live Cards as requested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Commission */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Commission</p>
          <p className="text-xl font-bold text-slate-900">₹{todayEarned.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Earned dynamically today</span>
          </div>
        </div>

        {/* Monthly Commission */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Commission</p>
          <p className="text-xl font-bold text-slate-900">₹{monthlyEarned.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Active calendar month</span>
          </div>
        </div>

        {/* Total Commission Paid */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600">₹{totalPaidCommission.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Marked as "Paid" payouts</span>
          </div>
        </div>

        {/* Pending Commission */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Commission</p>
          <p className="text-xl font-bold text-amber-600">₹{totalPendingCommission.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting disbursal</span>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Employees</p>
          <p className="text-xl font-bold text-[#003366]">{totalEmployeesCount}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Registered profiles</span>
          </div>
        </div>

        {/* Active Collectors */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Collectors</p>
          <p className="text-xl font-bold text-emerald-600">{activeCollectorsCount}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-500" />
            <span>Collectors currently active</span>
          </div>
        </div>
      </div>

      {/* Main Commission Register Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#003366]" />
            <h3 className="font-bold text-slate-800 text-sm">Employee Commission Register Ledger</h3>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              onClick={exportRegisterPDF}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Export Register to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              PDF
            </button>
            <button
              onClick={exportRegisterExcel}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Export Register to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel
            </button>
            <button
              onClick={handlePrint}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Print Ledger"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print
            </button>
          </div>
        </div>

        {/* Register Search and Filters (Requirement 3 & 4) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-slate-100 print:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, ID, Phone..."
              value={registerSearchQuery}
              onChange={(e) => setRegisterSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#003366] transition-all"
            />
          </div>

          <div>
            <select
              value={registerFilterStatus}
              onChange={(e) => setRegisterFilterStatus(e.target.value)}
              className="w-full border-slate-200 rounded-lg text-xs outline-none p-2.5 bg-slate-50 focus:bg-white border"
            >
              <option value="All">All Status (Active/Inactive/Paid/Pending)</option>
              <option value="Active">Profile: Active Only</option>
              <option value="Inactive">Profile: Inactive Only</option>
              <option value="Paid">Commissions: Paid (Fully Settled)</option>
              <option value="Pending">Commissions: Pending (Has Balance)</option>
            </select>
          </div>

          <div>
            <select
              value={registerFilterBranch}
              onChange={(e) => setRegisterFilterBranch(e.target.value)}
              className="w-full border-slate-200 rounded-lg text-xs outline-none p-2.5 bg-slate-50 focus:bg-white border"
            >
              <option value="All">All Branches</option>
              {uniqueBranches.map((branch) => (
                <option key={branch} value={branch}>
                  Branch: {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400">
            <span>Showing {filteredRegisterEmployees.length} of {employeeStatsList.length} employees</span>
          </div>
        </div>

        {/* Commission Register Table (Requirement 2) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="p-4">Employee ID</th>
                <th className="p-4">Employee Name</th>
                <th className="p-4">Mobile Number</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Designation</th>
                <th className="p-4 text-center">Members Managed</th>
                <th className="p-4 text-center">Collections Count (Sum)</th>
                <th className="p-4 text-right">Commission Earned</th>
                <th className="p-4 text-right">Commission Paid</th>
                <th className="p-4 text-right bg-slate-50/50">Pending Commission</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegisterEmployees.length > 0 ? (
                filteredRegisterEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-mono font-semibold text-slate-700">{emp.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{emp.phone}</td>
                    <td className="p-4 text-slate-600">{emp.branch}</td>
                    <td className="p-4 text-slate-600">{emp.designation}</td>
                    <td className="p-4 text-center text-slate-700 font-semibold">{emp.membersCount}</td>
                    <td className="p-4 text-center">
                      <span className="font-semibold text-slate-700">{emp.collectionsCount}</span>{" "}
                      <span className="text-slate-400 text-[10px]">(₹{emp.collectionsSum.toLocaleString()})</span>
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-800">
                      ₹{emp.commissionEarned.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-semibold text-emerald-600">
                      ₹{emp.commissionPaid.toLocaleString()}
                    </td>
                    <td className={`p-4 text-right font-bold bg-slate-50/20 ${emp.pendingCommission > 0 ? "text-amber-600" : "text-slate-500"}`}>
                      ₹{emp.pendingCommission.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${
                        emp.status === "Active" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <button
                        onClick={() => setSelectedDetailsEmployeeId(emp.id)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-[#003366] hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="text-center py-10 text-slate-400 text-sm">
                    No matching employee records found. Check filters or add employee profiles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Commission Details Modal (Requirement 5 & 6) */}
      {selectedDetailsEmployeeId && detailsEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#003366] text-white flex justify-between items-center">
              <div>
                <span className="bg-blue-800 text-blue-100 px-2 py-0.5 rounded font-mono font-bold text-xs">
                  {detailsEmp.id}
                </span>
                <h3 className="text-lg font-bold mt-1 text-white">{detailsEmp.name} - Commission Dossier</h3>
              </div>
              <button
                onClick={() => setSelectedDetailsEmployeeId(null)}
                className="text-white hover:text-slate-200 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {/* Quick Profile Bio Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-400 font-bold uppercase mb-0.5">Designation</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {detailsEmp.designation}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase mb-0.5">Branch</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {detailsEmp.branch}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase mb-0.5">Mobile Phone</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-1 font-mono">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" /> {detailsEmp.phone}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase mb-0.5">Status</p>
                  <p className="font-semibold text-slate-800">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      detailsEmp.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}>
                      {detailsEmp.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Commission Stats Cards Grid (Requirement 5) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Total Collections</p>
                  <p className="text-lg font-bold text-slate-800">{detailsEmp.collectionsCount} collections</p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">₹{detailsEmp.collectionsSum.toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Commission Earned</p>
                  <p className="text-lg font-bold text-[#003366]">₹{detailsEmp.commissionEarned.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Includes registrations</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-1">Paid Amount</p>
                  <p className="text-lg font-bold text-emerald-600">₹{detailsEmp.commissionPaid.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total processed payouts</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center bg-amber-50/30 border-amber-200">
                  <p className="text-amber-700 text-xs font-bold uppercase mb-1">Pending Amount</p>
                  <p className="text-lg font-extrabold text-amber-600">₹{detailsEmp.pendingCommission.toLocaleString()}</p>
                  {isAdmin && detailsEmp.pendingCommission > 0 && (
                    <button
                      onClick={() => handleQuickPayout(detailsEmp.id, detailsEmp.pendingCommission)}
                      className="mt-2 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded shadow-sm transition-colors cursor-pointer"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>

              {/* Subtabs for Details */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-3">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Ledgers & Historical Journals</h4>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Payments history for this employee */}
                  <div>
                    <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mb-2">
                      <History className="w-3.5 h-3.5 text-slate-500" /> Disbursed Payout Transactions
                    </h5>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto text-[11px] bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] border-b border-slate-100">
                            <th className="p-2">Date</th>
                            <th className="p-2">Period Cycle</th>
                            <th className="p-2">Amount Paid</th>
                            <th className="p-2">Reference No</th>
                            <th className="p-2">Remarks</th>
                            <th className="p-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {commissionPayments.filter(p => p.employeeId === detailsEmp.id).length > 0 ? (
                            commissionPayments.filter(p => p.employeeId === detailsEmp.id).map(p => (
                              <tr key={p.id} className="hover:bg-slate-50">
                                <td className="p-2 font-mono">{p.paymentDate}</td>
                                <td className="p-2 font-semibold text-slate-700">{p.period ? formatPeriod(p.period) : "N/A"}</td>
                                <td className="p-2 font-bold text-slate-800">₹{p.amount.toLocaleString()}</td>
                                <td className="p-2 text-slate-500 font-mono">{p.referenceNumber || "N/A"}</td>
                                <td className="p-2 text-slate-500 italic max-w-xs truncate">{p.remarks}</td>
                                <td className="p-2 text-center">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    p.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="text-center py-4 text-slate-400 italic">
                                No previous payout history recorded for this employee.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Collections list for this employee */}
                  <div>
                    <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mb-2">
                      <Coins className="w-3.5 h-3.5 text-slate-500" /> Daily Deposit Collections Handled
                    </h5>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto text-[11px] bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] border-b border-slate-100">
                            <th className="p-2">Date/Time</th>
                            <th className="p-2">Member Account</th>
                            <th className="p-2">Type</th>
                            <th className="p-2 text-right">Collected Amount</th>
                            <th className="p-2 text-right">Calculated Commission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {commissionRows.filter(r => r.employeeId === detailsEmp.id && r.type === "Daily Collection").length > 0 ? (
                            commissionRows.filter(r => r.employeeId === detailsEmp.id && r.type === "Daily Collection").slice(0, 10).map(r => (
                              <tr key={r.id} className="hover:bg-slate-50">
                                <td className="p-2">
                                  <div className="font-semibold">{r.date}</div>
                                  <div className="text-[9px] text-slate-400">{r.time}</div>
                                </td>
                                <td className="p-2">
                                  <div className="font-medium text-slate-700">{r.memberName}</div>
                                  <div className="font-mono text-[9px] text-slate-400">{r.memberId}</div>
                                </td>
                                <td className="p-2 text-slate-500">{r.type}</td>
                                <td className="p-2 text-right text-slate-700 font-medium">₹{r.amount.toLocaleString()}</td>
                                <td className="p-2 text-right text-emerald-600 font-bold">₹{r.commission.toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-slate-400 italic">
                                No collection items recorded for this employee.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Registered members list */}
                  <div>
                    <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mb-2">
                      <User className="w-3.5 h-3.5 text-slate-500" /> Members Registered (Acquisition Incentives)
                    </h5>
                    <div className="border border-slate-200 rounded-lg overflow-x-auto text-[11px] bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] border-b border-slate-100">
                            <th className="p-2">Join Date</th>
                            <th className="p-2">Member Account</th>
                            <th className="p-2">Phone</th>
                            <th className="p-2 text-right">Incentive Commission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.filter(m => m.registeredBy === detailsEmp.id).length > 0 ? (
                            members.filter(m => m.registeredBy === detailsEmp.id).map(m => (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="p-2">{m.joinDate}</td>
                                <td className="p-2">
                                  <div className="font-semibold text-slate-700">{m.name}</div>
                                  <div className="font-mono text-[9px] text-slate-400">{m.id}</div>
                                </td>
                                <td className="p-2 text-slate-500 font-mono">{m.phone}</td>
                                <td className="p-2 text-right text-emerald-600 font-bold">₹{(Number(detailsEmp.registrationCommission) || 0).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-slate-400 italic">
                                No registered members under this employee.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                onClick={() => setSelectedDetailsEmployeeId(null)}
                className="px-4 py-2 bg-[#003366] hover:bg-[#004080] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Disbursal History & Audit Logs Section (Requirement 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment history list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-5 h-5 text-slate-500" /> Commission History & Payouts Ledger
            </h3>
            <div className="flex gap-2 print:hidden">
              <button
                onClick={exportHistoryPDF}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Export History to PDF"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={exportHistoryExcel}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Export History to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {(commissionPayments || []).length > 0 ? (
              commissionPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col md:flex-row justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{pay.employeeName}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {pay.employeeId}
                      </span>
                      <span className="text-[10px] text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                        Cycle: {pay.period ? formatPeriod(pay.period) : "N/A"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                      <span>Paid Date: {pay.paymentDate}</span>
                      <span className="font-mono text-slate-400">ID: {pay.id}</span>
                      {pay.referenceNumber && <span>Ref No: <span className="font-mono text-slate-600">{pay.referenceNumber}</span></span>}
                    </div>
                    {pay.remarks && <p className="text-[11px] text-slate-400 italic">"{pay.remarks}"</p>}
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-800">₹{pay.amount.toLocaleString()}</span>
                      <div className="mt-0.5">
                        {isAdmin ? (
                          <select
                            value={pay.status}
                            onChange={(e) => updateCommissionPayment(pay.id, { status: e.target.value as "Paid" | "Pending" })}
                            className={`text-[9px] font-bold rounded px-1.5 py-0.5 outline-none cursor-pointer border ${
                              pay.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                          </select>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            pay.status === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {pay.status}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this payment record?")) {
                            deleteCommissionPayment(pay.id);
                            showNotification("Deleted payout record");
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No commission payment history found. Record a payout to begin tracking disbursals.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log for Commission processes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 print:hidden">
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-slate-500" /> Commission Audits
            </h3>
            <span className="text-[10px] text-slate-400 uppercase font-bold text-[#003366]">Security Logs</span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {commissionAudits.length > 0 ? (
              commissionAudits.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-1 text-[11px] hover:bg-slate-100/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">{log.action}</span>
                    <span className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-relaxed">{log.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No commission audit logs recorded yet. Daily deposits will trigger dynamic calculations automatically.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
