import React, { useState } from "react";
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
  Search
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
  const employeeId = user?.role === "Employee" ? user.memberId : "";

  // Filter States
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || "All");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Payment Form States
  const [payEmpId, setPayEmpId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payStatus, setPayStatus] = useState<"Paid" | "Pending">("Paid");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [showPayForm, setShowPayForm] = useState(false);

  // Success Notification state
  const [successMsg, setSuccessMsg] = useState("");

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Helper calculation formulas
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.substring(0, 7);

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

  // Detailed rows of calculated commission items
  const commissionRows: any[] = [];

  // Add collections
  collections.forEach((c) => {
    if (c.type !== "Registration Fee" && c.collectedBy && c.collectedBy !== "admin") {
      const emp = employees.find((e) => e.id === c.collectedBy);
      const mName = members.find((mb) => mb.id === c.memberId)?.name || c.memberId;
      commissionRows.push({
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
      commissionRows.push({
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
  commissionRows.sort((a, b) => b.rawTimestamp.localeCompare(a.rawTimestamp));

  // Apply filters
  const filteredRows = commissionRows.filter((row) => {
    if (selectedEmployee !== "All" && row.employeeId !== selectedEmployee) {
      return false;
    }
    if (selectedDate && row.date !== selectedDate) {
      return false;
    }
    if (selectedMonth && !row.date.startsWith(selectedMonth)) {
      return false;
    }
    return true;
  });

  // Aggregate Commission Metrics
  const activeEmployeeId = isAdmin ? (selectedEmployee === "All" ? "" : selectedEmployee) : employeeId;

  const totalCalculated = commissionRows
    .filter((row) => !activeEmployeeId || row.employeeId === activeEmployeeId)
    .reduce((sum, row) => sum + row.commission, 0);

  const totalPaid = (commissionPayments || [])
    .filter((p) => !activeEmployeeId || p.employeeId === activeEmployeeId)
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingCommission = totalCalculated - totalPaid;

  const todayEarned = commissionRows
    .filter((row) => (!activeEmployeeId || row.employeeId === activeEmployeeId) && row.date === todayStr)
    .reduce((sum, row) => sum + row.commission, 0);

  const monthlyEarned = commissionRows
    .filter((row) => (!activeEmployeeId || row.employeeId === activeEmployeeId) && row.date.startsWith(currentMonthStr))
    .reduce((sum, row) => sum + row.commission, 0);

  // Handle Form Submission
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId) {
      alert("Please select an employee");
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const emp = employees.find((x) => x.id === payEmpId);
    addCommissionPayment({
      employeeId: payEmpId,
      employeeName: emp?.name || "Employee",
      amount: Number(payAmount),
      status: payStatus,
      paymentDate: payDate,
      referenceNumber: payRef,
      remarks: payRemarks
    });

    showNotification(`Successfully saved ₹${payAmount} payout for ${emp?.name}`);
    
    // Reset Form
    setPayEmpId("");
    setPayAmount("");
    setPayRef("");
    setPayRemarks("");
    setShowPayForm(false);
  };

  // EXPORT HANDLERS
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text("SMART SAVE - Employee Commission Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
    doc.text(`Filters - Employee: ${selectedEmployee}, Date: ${selectedDate || "All"}, Month: ${selectedMonth || "All"}`, 14, 32);

    const headers = [["Date", "Employee", "Member", "Type", "Amount", "Commission (₹)"]];
    const data = filteredRows.map((r) => [
      r.date,
      r.employeeName,
      r.memberName,
      r.type,
      `Rs ${r.amount.toLocaleString()}`,
      r.commission
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 38,
      theme: "grid",
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.save(`commission-report-${todayStr}.pdf`);
  };

  const exportExcel = () => {
    const dataToExport = filteredRows.map((r) => ({
      Date: r.date,
      Time: r.time,
      "Employee ID": r.employeeId,
      "Employee Name": r.employeeName,
      "Member ID": r.memberId,
      "Member Name": r.memberName,
      Type: r.type,
      "Collection Amount (Rs)": r.amount,
      "Commission (Rs)": r.commission
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commission Report");
    XLSX.writeFile(workbook, `commission-report-${todayStr}.xlsx`);
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
          <h1 className="text-2xl font-bold text-slate-800">Employee Commission</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track daily collection incentives, monthly performance and payout records.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowPayForm(!showPayForm)}
              className="bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#004080] transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Record Payout
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Record Payout Form Modal/Panel */}
      {showPayForm && isAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-[#003366] px-6 py-4 text-white">
            <h3 className="font-bold">Record Commission Payout</h3>
            <p className="text-xs text-blue-100 mt-0.5">Disburse pending collection commissions to employee profiles.</p>
          </div>
          <form onSubmit={handleRecordPayment} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Employee *</label>
              <select
                required
                value={payEmpId}
                onChange={(e) => {
                  setPayEmpId(e.target.value);
                  // Auto-populate pending commission as default amount
                  const empRows = commissionRows.filter((r) => r.employeeId === e.target.value);
                  const empEarned = empRows.reduce((sum, r) => sum + r.commission, 0);
                  const empPaid = commissionPayments
                    .filter((p) => p.employeeId === e.target.value && p.status === "Paid")
                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                  setPayAmount(Math.max(0, empEarned - empPaid).toString());
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Amount (₹) *</label>
              <input
                required
                type="number"
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
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
                placeholder="Add special conditions or pay description here..."
                className="w-full border-slate-200 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#003366] border"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPayForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Disburse Payout
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Dashboard Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Commission</p>
          <p className="text-2xl font-bold text-slate-900">₹{todayEarned.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Earned dynamically today</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Commission</p>
          <p className="text-2xl font-bold text-slate-900">₹{monthlyEarned.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Active calendar month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Paid Payouts</p>
          <p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Marked as "Paid"</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Balance</p>
          <p className="text-2xl font-bold text-amber-600">₹{pendingCommission.toLocaleString()}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Awaiting disbursal</span>
          </div>
        </div>
      </div>

      {/* Reports and Filters section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4.5 h-4.5 text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">Filter & Export Incentives</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportPDF}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              PDF
            </button>
            <button
              onClick={exportExcel}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Excel
            </button>
            <button
              onClick={handlePrint}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              Print
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Filter Employee</label>
            {isAdmin ? (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full border-slate-200 rounded-lg text-xs outline-none p-2.5 bg-slate-50 focus:bg-white border"
              >
                <option value="All">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            ) : (
              <input
                readOnly
                type="text"
                value={user?.name || "My Profile"}
                className="w-full border-slate-200 rounded-lg text-xs outline-none p-2.5 bg-slate-100 border cursor-not-allowed"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Filter Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setSelectedMonth(""); // clear monthly filter if daily is chosen
              }}
              className="w-full border-slate-200 rounded-lg text-xs outline-none p-2 bg-slate-50 focus:bg-white border"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Filter Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) setSelectedDate(""); // clear daily filter if monthly is chosen
              }}
              className="w-full border-slate-200 rounded-lg text-xs outline-none p-2 bg-slate-50 focus:bg-white border"
            />
          </div>
        </div>

        {/* Detailed Commission Collections List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="p-4">Date/Time</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Member Account</th>
                <th className="p-4">Transaction Type</th>
                <th className="p-4 text-right">Collection Amount</th>
                <th className="p-4 text-right">Commission Incentive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{row.date}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{row.time}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{row.employeeName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.employeeId}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{row.memberName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{row.memberId}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        row.type === "Daily Collection" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-slate-700">
                      ₹{row.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600">
                      ₹{row.commission.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching commission items found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Disbursal History & Audit Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4.5 h-4.5 text-slate-500" /> Payout Disbursement Records
            </h3>
            <span className="text-[10px] text-slate-400">Admin Ledger</span>
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
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
                      <span>Date: {pay.paymentDate}</span>
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
                No commission payment history found. Choose "Record Payout" above to disperse commissions.
              </div>
            )}
          </div>
        </div>

        {/* Audit Log for Commission processes */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
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
