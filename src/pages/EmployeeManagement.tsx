import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Eye,
  Download,
  Printer,
  Calendar,
  DollarSign,
  UserCheck,
  Building,
  Target,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  Percent,
  History,
  Check,
  Camera,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { Employee } from "../types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function EmployeeManagement() {
  const {
    employees,
    collections,
    members,
    attendance,
    loginHistory,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    markAttendance,
    commissionPayments,
    settings,
  } = useData();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("All Branches");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [attendanceModalEmp, setAttendanceModalEmp] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    aadhaar: "",
    designation: "",
    branch: "",
    username: "",
    password: "",
    dailyTarget: "",
    monthlySalary: "",
    commissionPercentage: "",
    registrationCommission: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "Active" as "Active" | "Inactive",
    photo: "",
  });

  const [notification, setNotification] = useState("");

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  // Extract unique branches
  const branches = useMemo(() => {
    const unique = new Set(employees.map((e) => e.branch).filter(Boolean));
    unique.add("Online Branch");
    unique.add("Offline Branch");
    return ["All Branches", ...Array.from(unique)];
  }, [employees]);

  // Filter Employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        emp.id.toLowerCase().includes(query) ||
        emp.name.toLowerCase().includes(query) ||
        emp.phone.toLowerCase().includes(query);

      const matchBranch =
        filterBranch === "All Branches" ||
        emp.branch === filterBranch ||
        (filterBranch === "Online Branch" && (emp.branch === "Online" || emp.branch === "Online Branch")) ||
        (filterBranch === "Offline Branch" && (emp.branch === "Offline" || emp.branch === "Offline Branch"));

      const matchStatus =
        filterStatus === "All Status" || emp.status === filterStatus;

      return matchSearch && matchBranch && matchStatus;
    });
  }, [employees, searchQuery, filterBranch, filterStatus]);

  // Open Form for Adding
  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      aadhaar: "",
      designation: "",
      branch: "",
      username: "",
      password: "",
      dailyTarget: "",
      monthlySalary: "",
      commissionPercentage: "",
      registrationCommission: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "Active",
      photo: "",
    });
    setIsFormModalOpen(true);
  };

  // Open Form for Editing
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      email: emp.email,
      address: emp.address,
      aadhaar: emp.aadhaar,
      designation: emp.designation,
      branch: emp.branch,
      username: emp.username,
      password: emp.password || "",
      dailyTarget: emp.dailyTarget,
      monthlySalary: emp.monthlySalary,
      commissionPercentage: emp.commissionPercentage,
      registrationCommission: emp.registrationCommission || "",
      joinDate: emp.joinDate,
      status: emp.status,
      photo: emp.photo || "",
    });
    setIsFormModalOpen(true);
  };

  // Save Employee Form
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.username) {
      alert("Please fill in Name, Phone, and Username");
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, formData);
      showNotification("Employee updated successfully.");
    } else {
      addEmployee(formData);
      showNotification("Employee added successfully.");
    }
    setIsFormModalOpen(false);
  };

  // Delete Employee trigger
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  // Confirm and Execute Delete Employee
  const confirmDelete = () => {
    if (deleteConfirmId) {
      try {
        deleteEmployee(deleteConfirmId);
        showNotification("Employee deleted successfully.");
        if (viewingEmployee?.id === deleteConfirmId) {
          setViewingEmployee(null);
        }
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Failed to delete employee:", error);
        alert("Failed to delete employee. Please try again.");
      }
    }
  };

  // Get Employee Metrics
  const getEmployeeMetrics = (empId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
    const empCollections = collections.filter((c) => c.collectedBy === empId);
    
    const dailyCollections = empCollections.filter((c) =>
      c.timestamp.startsWith(todayStr)
    );

    const dailyCollectionCount = dailyCollections.length;
    const todayCollectionAmount = dailyCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const monthlyCollections = empCollections.filter((c) =>
      c.timestamp.startsWith(currentMonthStr)
    );
    const monthlyCollectionCount = monthlyCollections.length;
    const monthlyCollectionAmount = monthlyCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const totalCollectionAmount = empCollections.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0
    );

    const registeredCount = members.filter((m) => m.registeredBy === empId).length;
    const registeredToday = members.filter((m) => m.registeredBy === empId && m.joinDate === todayStr).length;
    const registeredMonthly = members.filter((m) => m.registeredBy === empId && m.joinDate.startsWith(currentMonthStr)).length;

    // Commission Earned
    const emp = employees.find((e) => e.id === empId);
    const colCommRate = Number(settings?.employeeCommissionPerCollection || 5);
    const regComm = Number(emp?.registrationCommission || 0);

    const getColCommission = (colList: any[]) => {
      return colList
        .filter((c) => c.type !== "Registration Fee")
        .reduce((sum, c) => sum + colCommRate, 0);
    };

    const todayCommission = getColCommission(dailyCollections) + (registeredToday * regComm);
    const monthlyCommission = getColCommission(monthlyCollections) + (registeredMonthly * regComm);
    const commissionEarned = getColCommission(empCollections) + (registeredCount * regComm);

    const empAttendance = attendance.filter((a) => a.employeeId === empId);
    const empLoginHistory = loginHistory.filter((lh) => lh.employeeId === empId);

    return {
      dailyCollectionCount,
      todayCollectionAmount,
      monthlyCollectionCount,
      monthlyCollectionAmount,
      totalCollectionAmount,
      registeredCount,
      todayCommission,
      monthlyCommission,
      commissionEarned,
      attendanceList: empAttendance,
      loginHistoryList: empLoginHistory,
    };
  };

  // Export List to PDF
  const exportListPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Smart Save Financial - Employee List", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [["ID", "Name", "Mobile", "Email", "Branch", "Designation", "Status"]],
      body: filteredEmployees.map((e) => [
        e.id,
        e.name,
        e.phone,
        e.email,
        e.branch,
        e.designation,
        e.status,
      ]),
    });

    doc.save("Employee_List.pdf");
  };

  // Export List to Excel
  const exportListExcel = () => {
    const data = filteredEmployees.map((e) => ({
      "Employee ID": e.id,
      "Full Name": e.name,
      "Mobile Number": e.phone,
      "Email Address": e.email,
      "Branch": e.branch,
      "Designation": e.designation,
      "Aadhaar Number": e.aadhaar,
      "Address": e.address,
      "Salary": e.monthlySalary,
      "Commission %": e.commissionPercentage,
      "Daily Target": e.dailyTarget,
      "Date Joined": e.joinDate,
      "Status": e.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_List.xlsx");
  };

  // Print List
  const printList = () => {
    window.print();
  };

  // Export Profile to PDF
  const exportProfilePDF = (emp: Employee) => {
    const metrics = getEmployeeMetrics(emp.id);
    const doc = new jsPDF();
    
    // Add photo to PDF top right if exists
    if (emp.photo) {
      try {
        doc.addImage(emp.photo, "JPEG", 165, 8, 30, 30);
      } catch (e) {
        console.error("Error adding photo to PDF", e);
      }
    }

    doc.setFontSize(16);
    doc.text(`Employee Profile - ${emp.name} (${emp.id})`, 14, 20);
    
    doc.setFontSize(11);
    doc.text("Personal Details:", 14, 32);
    doc.text(`Mobile: ${emp.phone}`, 14, 38);
    doc.text(`Email: ${emp.email}`, 14, 44);
    doc.text(`Aadhaar/ID: ${emp.aadhaar}`, 14, 50);
    doc.text(`Designation: ${emp.designation}`, 14, 56);
    doc.text(`Branch: ${emp.branch}`, 14, 62);
    doc.text(`Join Date: ${emp.joinDate}`, 14, 68);
    doc.text(`Status: ${emp.status}`, 14, 74);

    doc.text("Performance Metrics:", 110, 32);
    doc.text(`Daily Collection Target: Rs ${emp.dailyTarget}`, 110, 38);
    doc.text(`Monthly Salary: Rs ${emp.monthlySalary}`, 110, 44);
    doc.text(`Commission %: ${emp.commissionPercentage}%`, 110, 50);
    doc.text(`Today's Collection Count: ${metrics.dailyCollectionCount}`, 110, 56);
    doc.text(`Total Collection Amount: Rs ${metrics.totalCollectionAmount}`, 110, 62);
    doc.text(`Members Registered: ${metrics.registeredCount}`, 110, 68);
    doc.text(`Commission Earned: Rs ${metrics.commissionEarned}`, 110, 74);

    autoTable(doc, {
      startY: 85,
      head: [["Login History Timestamp", "Device/Platform", "IP Address"]],
      body: metrics.loginHistoryList.slice(0, 10).map((lh) => [
        new Date(lh.timestamp).toLocaleString(),
        lh.device || "N/A",
        lh.ipAddress || "N/A",
      ]),
    });

    doc.save(`Profile_${emp.id}.pdf`);
  };

  // Overall Statistics for top bar
  const overallStats = React.useMemo(() => {
    const totalCount = employees.length;
    const activeCount = employees.filter((e) => e.status === "Active").length;
    
    // Total Collections across ALL employees
    const allColls = collections.filter((c) => employees.some((e) => e.id === c.collectedBy));
    const totalCollsAmount = allColls.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    
    // Total Commissions earned by ALL employees
    const totalCommissions = employees.reduce((sum, emp) => {
      const empCollections = collections.filter((c) => c.collectedBy === emp.id);
      const commPct = Number(emp.commissionPercentage || 0);
      const regComm = Number(emp.registrationCommission || 0);
      const regCount = members.filter((m) => m.registeredBy === emp.id).length;
      const empComm = empCollections.reduce((s, c) => s + (Number(c.amount || 0) * commPct) / 100, 0) + (regCount * regComm);
      return sum + empComm;
    }, 0);

    return {
      totalCount,
      activeCount,
      totalCollsAmount,
      totalCommissions,
    };
  }, [employees, collections, members]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          {viewingEmployee ? (
            <button
              onClick={() => setViewingEmployee(null)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-[#003366] transition-colors mb-2 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              ← Back to Employee List
            </button>
          ) : null}
          <h1 className="text-2xl font-bold text-slate-800">
            {viewingEmployee ? `Employee Profile: ${viewingEmployee.name}` : "Employee Management"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {viewingEmployee
              ? `Detailed performance audit, credentials, and logs for ${viewingEmployee.name} (${viewingEmployee.id}).`
              : "Register and manage collectors, assign commissions, and view performance audits."}
          </p>
        </div>
        {!viewingEmployee && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportListPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" /> PDF
            </button>
            <button
              onClick={exportListExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" /> Excel
            </button>
            <button
              onClick={printList}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" /> Print
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#002244] shadow transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        )}
      </div>

      {/* Overall Statistics Dashboard (only shown on List View) */}
      {!viewingEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Employees</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">{overallStats.totalCount}</span>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg">
              👥
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Active Collectors</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{overallStats.activeCount}</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-lg">
              ⚡
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Total Collections</span>
              <span className="text-2xl font-black text-[#003366] mt-1 block">₹{overallStats.totalCollsAmount.toLocaleString()}</span>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
              ₹
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider">Commissions</span>
              <span className="text-2xl font-black text-amber-600 mt-1 block">₹{overallStats.totalCommissions.toLocaleString()}</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-lg">
              📈
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar (only shown on List View) */}
      {!viewingEmployee && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search Name, ID or Mobile Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
            >
              <option value="All Status">All Employees</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* Employee List Panel (Full Width) */}
        {!viewingEmployee ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden col-span-1">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                Employee Register ({filteredEmployees.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">Employee ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total Collections</th>
                    <th className="px-4 py-3 text-right">Members Registered</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => {
                      const metrics = getEmployeeMetrics(emp.id);
                      return (
                        <tr
                          key={emp.id}
                          onClick={() => setViewingEmployee(emp)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3.5 align-middle font-mono text-xs text-slate-600 font-bold">
                            {emp.id}
                          </td>
                          <td className="px-4 py-3.5 align-middle font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                                {emp.photo ? (
                                  <img 
                                    src={emp.photo} 
                                    alt={emp.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  emp.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span>{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-slate-600">
                            {emp.phone}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-slate-600">
                            {emp.branch}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-slate-600 font-medium">
                            {emp.designation}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                emp.status === "Active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right text-slate-900 font-semibold">
                            ₹{metrics.totalCollectionAmount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right text-slate-600">
                            {metrics.registeredCount}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right text-emerald-600 font-semibold">
                            ₹{metrics.commissionEarned.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 align-middle text-right print:hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingEmployee(emp)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setAttendanceModalEmp(emp);
                                }}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                title="Attendance Status"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                        No employees match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Profile Details Panel (Shown when an employee is selected, takes full screen) */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col col-span-1 animate-in fade-in slide-in-from-bottom-2">
            {/* Profile Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md overflow-hidden shrink-0">
                  {viewingEmployee.photo ? (
                    <img 
                      src={viewingEmployee.photo} 
                      alt={viewingEmployee.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    viewingEmployee.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{viewingEmployee.name}</h2>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 rounded">
                      {viewingEmployee.id}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{viewingEmployee.designation} &bull; {viewingEmployee.branch}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => exportProfilePDF(viewingEmployee)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  title="Export Profile PDF"
                >
                  <Download className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setViewingEmployee(null)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                  title="Close Profile"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[700px] flex-1">
              {/* Profile KPI Cards */}
              {(() => {
                const m = getEmployeeMetrics(viewingEmployee.id);
                const empPayments = (commissionPayments || []).filter((p) => p.employeeId === viewingEmployee.id);
                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Today's Collections</span>
                        <span className="text-base font-bold text-slate-800 mt-1 block">{m.dailyCollectionCount}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Today's Commission</span>
                        <span className="text-base font-bold text-emerald-600 mt-1 block">₹{m.todayCommission.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Monthly Collections</span>
                        <span className="text-base font-bold text-slate-800 mt-1 block">{m.monthlyCollectionCount}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Monthly Commission</span>
                        <span className="text-base font-bold text-emerald-600 mt-1 block">₹{m.monthlyCommission.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Collections</span>
                        <span className="text-base font-bold text-[#003366] mt-1 block">₹{m.totalCollectionAmount.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center animate-in zoom-in-95">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Commission</span>
                        <span className="text-base font-bold text-emerald-700 mt-1 block">₹{m.commissionEarned.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Personal & Financial Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-3.5">
                        <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                          <User className="w-4.5 h-4.5 text-slate-400" /> Personal Details
                        </h4>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Mobile:</span>
                          <span className="col-span-2 text-slate-800 font-semibold">{viewingEmployee.phone}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Email:</span>
                          <span className="col-span-2 text-slate-800">{viewingEmployee.email || "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Address:</span>
                          <span className="col-span-2 text-slate-800 text-xs">{viewingEmployee.address || "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Aadhaar/ID:</span>
                          <span className="col-span-2 text-slate-800 font-mono text-xs">{viewingEmployee.aadhaar || "N/A"}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Joined Date:</span>
                          <span className="col-span-2 text-slate-800">{viewingEmployee.joinDate}</span>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-4.5 h-4.5 text-slate-400" /> Financial & Rules
                        </h4>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Monthly Salary:</span>
                          <span className="col-span-2 text-slate-800 font-bold">Rs {Number(viewingEmployee.monthlySalary).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Commission Rate:</span>
                          <span className="col-span-2 text-emerald-600 font-bold">{settings.employeeCommissionPerCollection || "5"} ₹/col</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Reg. Commission:</span>
                          <span className="col-span-2 text-emerald-600 font-bold">₹{Number(viewingEmployee.registrationCommission || 0).toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Collection Target:</span>
                          <span className="col-span-2 text-slate-800 font-semibold">Rs {Number(viewingEmployee.dailyTarget).toLocaleString()} / Day</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Username:</span>
                          <span className="col-span-2 text-slate-800 font-mono text-xs">{viewingEmployee.username}</span>
                        </div>
                        <div className="grid grid-cols-3 text-sm">
                          <span className="text-slate-500">Password:</span>
                          <span className="col-span-2 text-slate-400 font-mono text-xs">********</span>
                        </div>
                      </div>
                    </div>

                    {/* Multi-grid tabs */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4.5 h-4.5 text-slate-400" /> Attendance History
                          </span>
                        </h4>
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {m.attendanceList.length > 0 ? (
                            m.attendanceList.map((att) => (
                              <div key={att.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded border border-slate-100 animate-in fade-in-50">
                                <span className="font-semibold text-slate-700">{att.date}</span>
                                <div className="flex items-center gap-2">
                                  {att.checkIn && <span className="text-[10px] text-slate-400">In: {att.checkIn}</span>}
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    att.status === "Present" ? "bg-emerald-100 text-emerald-800" :
                                    att.status === "Absent" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {att.status}
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 text-center py-6">No attendance records yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Login History tab */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                          <History className="w-4.5 h-4.5 text-slate-400" /> Login Audits
                        </h4>
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {m.loginHistoryList.length > 0 ? (
                            m.loginHistoryList.map((lh) => (
                              <div key={lh.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 flex flex-col gap-0.5 animate-in fade-in-50">
                                <div className="flex justify-between">
                                  <span className="font-semibold text-slate-700">
                                    {new Date(lh.timestamp).toLocaleString()}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{lh.ipAddress}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 truncate">{lh.device}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 text-center py-6">No login audits logged yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Commission Payment History tab */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 border-b pb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-4.5 h-4.5 text-slate-400" /> Commission Payments
                        </h4>
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {empPayments.length > 0 ? (
                            empPayments.map((p) => (
                              <div key={p.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 flex flex-col gap-1 animate-in fade-in-50">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-800">₹{p.amount.toLocaleString()}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    p.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex justify-between">
                                  <span>Ref: {p.referenceNumber || "N/A"}</span>
                                  <span>{p.paymentDate}</span>
                                </div>
                                {p.remarks && (
                                  <div className="text-[10px] text-slate-400 italic bg-white p-1 rounded border border-slate-50">
                                    "{p.remarks}"
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 text-center py-6">No payments recorded yet.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Fast Action Modal */}
      {attendanceModalEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Attendance status: {attendanceModalEmp.name}</h3>
              <button onClick={() => setAttendanceModalEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">Record attendance for today ({new Date().toISOString().split("T")[0]}):</p>
              <div className="grid grid-cols-2 gap-2">
                {(["Present", "Absent", "Half Day", "Leave"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      markAttendance(attendanceModalEmp.id, st);
                      setAttendanceModalEmp(null);
                      showNotification(`Attendance marked as ${st} for ${attendanceModalEmp.name}`);
                    }}
                    className="py-2.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold hover:border-blue-600 hover:bg-blue-50 text-slate-700 transition-colors"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">
                {editingEmployee ? `Edit Employee - ${editingEmployee.id}` : "Register New Employee"}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Personal Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  1. Profile Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <div className="flex flex-col md:flex-row items-center gap-4 border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-full border border-slate-200 overflow-hidden bg-white flex items-center justify-center shadow-xs">
                          {formData.photo ? (
                            <img 
                              src={formData.photo} 
                              alt="Employee Photo Preview" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <label className="absolute -bottom-1 -right-1 bg-[#003366] text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-800 transition-colors shadow-xs">
                          <Camera className="w-3.5 h-3.5" />
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/webp" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert("Maximum size allowed is 2 MB.");
                                  return;
                                }
                                const validFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                                if (!validFormats.includes(file.type)) {
                                  alert("Supported formats: JPG, PNG, WEBP.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({ ...formData, photo: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-xs font-bold text-slate-700">Profile Photo (Optional)</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG or WEBP. Max 2 MB.</p>
                        {formData.photo && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photo: "" })}
                            className="text-[10px] font-bold text-red-600 hover:text-red-800 mt-1.5 transition-colors flex items-center gap-1 mx-auto md:mx-0"
                          >
                            <Trash2 className="w-3" /> Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Aadhaar / ID Number</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formData.aadhaar}
                        onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                        placeholder="12-digit Aadhaar No"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street Address, City, State"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  2. Branch, Role & Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      placeholder="e.g. Collection Agent"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      placeholder="e.g. Noida Sector 15"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "Active" | "Inactive" })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Username *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Login Username"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Leave blank to keep same"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                    />
                  </div>
                </div>
              </div>

              {/* Financial target Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                  3. Targets & Financial Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Daily Collection Target (Rs)</label>
                    <div className="relative">
                      <span className="text-xs text-slate-400 absolute left-3 top-2.5">Rs</span>
                      <input
                        type="number"
                        value={formData.dailyTarget}
                        onChange={(e) => setFormData({ ...formData, dailyTarget: e.target.value })}
                        placeholder="15000"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Salary (Rs)</label>
                    <div className="relative">
                      <span className="text-xs text-slate-400 absolute left-3 top-2.5">Rs</span>
                      <input
                        type="number"
                        value={formData.monthlySalary}
                        onChange={(e) => setFormData({ ...formData, monthlySalary: e.target.value })}
                        placeholder="25000"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Daily Commission % *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={formData.commissionPercentage}
                        onChange={(e) => setFormData({ ...formData, commissionPercentage: e.target.value })}
                        placeholder="5"
                        className="w-full pr-8 pl-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Registration Commission (₹) *</label>
                    <div className="relative">
                      <span className="text-xs text-slate-400 absolute left-3 top-2.5">₹</span>
                      <input
                        type="number"
                        required
                        value={formData.registrationCommission}
                        onChange={(e) => setFormData({ ...formData, registrationCommission: e.target.value })}
                        placeholder="100"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#003366] text-white rounded-lg text-sm font-medium hover:bg-[#002244] shadow transition-colors"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Employee</h3>
                  <p className="text-sm text-slate-500">Permanently remove this employee profile.</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to delete this employee?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
