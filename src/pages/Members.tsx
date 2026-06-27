import { useAuth } from "../context/AuthContext";
import React, { useState, FormEvent, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Eye,
  Download,
  Printer,
  MessageCircle
} from "lucide-react";
import { Member } from "../types";
import { useData } from "../context/DataContext";
import { calculateFinancialSummary, calculateCollectionBreakdown, getFinancialConstants } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp } from "../utils/whatsapp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Members() {
  const { user } = useAuth();
  const { members, collections, addMember, updateMember, deleteMember, settings } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    return searchParams.get("status") || "All Status";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const m = members.find(m => m.id === idParam);
      if (m) {
        setViewingMember(m);
      }
    } else if (user?.role === "Member" && user.memberId) {
      const myProfile = members.find(m => m.id === user.memberId);
      if (myProfile) {
        setViewingMember(myProfile);
      }
    }
  }, [searchParams, user, members]);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const handleCloseProfile = () => {
    setViewingMember(null);
    if (searchParams.has("id") || searchParams.has("registered") || searchParams.has("status")) {
      setSearchParams({});
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [formError, setFormError] = useState("");
  const [notification, setNotification] = useState("");

  const openAddModal = () => {
    setFormError("");
    setFormData({
      name: "",
      phone: "",
      aadhaar: "",
      address: "",
      plan: "Daily",
      joinDate: new Date().toISOString().split("T")[0],
      dailyAmount: "",
      nomineeName: "",
      nomineePhone: "",
      status: "Active",
      balance: "₹0",
    });
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setFormError("");
    setFormData({ ...member });
    setEditingMember(member);
    setIsModalOpen(true);
  };
  
  const openProfileModal = (member: Member) => {
    setViewingMember(member);
  };

  const handleDelete = (id: string) => {
    if (user?.role === "Employee" || user?.role === "Member") {
      alert("You do not have permission to delete members.");
      return;
    }
    if (
      window.confirm(
        "Are you sure you want to delete this member? All their collections will also be deleted."
      )
    ) {
      deleteMember(id);
      showNotification("Member deleted successfully!");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validations
    if (
      !formData.name ||
      !formData.phone ||
      !formData.aadhaar ||
      !formData.dailyAmount
    ) {
      setFormError("Please fill all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setFormError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (!/^\d{12}$/.test(formData.aadhaar)) {
      setFormError("Aadhaar number must be exactly 12 digits.");
      return;
    }

    // Duplicate checks
    const duplicatePhone = members.find(
      (m) => m.phone === formData.phone && m.id !== formData.id
    );
    if (duplicatePhone) {
      setFormError("Mobile number already exists.");
      return;
    }

    const duplicateAadhaar = members.find(
      (m) => m.aadhaar === formData.aadhaar && m.id !== formData.id
    );
    if (duplicateAadhaar) {
      setFormError("Aadhaar number already exists.");
      return;
    }

    if (editingMember && formData.id) {
      updateMember(formData.id, formData);
      showNotification("Member updated successfully!");
    } else {
      addMember(formData as Omit<Member, "id">);
      showNotification("New member added successfully!");
    }
    setIsModalOpen(false);
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);
    const matchesStatus =
      statusFilter === "All Status" || m.status === statusFilter;
    
    // Check if filtered by today's registration
    const filterToday = searchParams.get("registered") === "today";
    const todayStr = new Date().toISOString().split("T")[0];
    const matchesTodayReg = !filterToday || m.joinDate === todayStr;

    return matchesSearch && matchesStatus && matchesTodayReg;
  });

  // For Member role, render the profile directly
  if (user?.role === "Member" && viewingMember) {
    const memberCols = collections.filter(c => c.memberId === viewingMember.id);
    const { totalSavings, totalBonus, registrationRevenue, totalCompanyCommission, totalCompanyProfit } = calculateFinancialSummary(memberCols, [viewingMember], settings);
    const maturityAmount = totalSavings + totalBonus;
    
    const regCollection = memberCols.find(c => c.type === "Registration Fee");
    const regDate = regCollection ? new Date(regCollection.timestamp).toLocaleDateString() : new Date(viewingMember.joinDate).toLocaleDateString();
    
    const planDuration = parseInt(settings.planDuration || "300", 10);
    const joinDate = new Date(viewingMember.joinDate);
    const maturityDateObj = new Date(joinDate);
    maturityDateObj.setDate(maturityDateObj.getDate() + planDuration);
    
    const totalDaysPaidObj = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, curr) => acc + (parseInt(curr.amount || "0", 10) / parseInt(viewingMember.dailyAmount || "1", 10)), 0);
    const totalDaysPaid = Math.round(totalDaysPaidObj);
    
    const remainingDays = Math.max(0, planDuration - totalDaysPaid);
    const progressPercentage = Math.min(100, Math.round((totalDaysPaid / planDuration) * 100));

    const totalDeposits = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, c) => acc + parseInt(c.amount || "0", 10), 0);

    const downloadReceiptPDF = (receipt: any) => {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102);
      doc.text("SMART SAVE FINANCIAL SYSTEMS", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Daily Collection Receipt", 105, 30, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.text(`Receipt No: ${receipt.receiptNo || receipt.id}`, 20, 50);
      doc.text(`Date: ${new Date(receipt.timestamp).toLocaleString()}`, 130, 50);
      doc.text(`Member ID: ${receipt.memberId}`, 20, 60);
      doc.text(`Member Name: ${receipt.memberName}`, 130, 60);
      doc.text(`Payment Type: ${receipt.type}`, 20, 70);
      doc.text(`Status: ${receipt.status}`, 130, 70);
      doc.setLineWidth(0.5);
      doc.line(20, 80, 190, 80);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Amount Received:", 20, 95);
      doc.setFontSize(16);
      doc.setTextColor(0, 153, 51);
      doc.text(`Rs ${parseInt(receipt.amount, 10).toLocaleString()}`, 130, 95);
      
      if (receipt.type === "Registration Fee") {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Registration Fee: Rs ${receipt.amount}`, 30, 105);
      } else {
        const breakdown = calculateCollectionBreakdown(parseInt(receipt.amount, 10), receipt.type);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Savings Fund: Rs ${breakdown.savingsFund}`, 30, 105);
        doc.text(`Company Commission: Rs ${breakdown.companyCommission}`, 130, 105);
        doc.text(`Bonus Fund: Rs ${breakdown.bonusFund}`, 30, 115);
        doc.text(`Company Profit: Rs ${breakdown.companyProfit}`, 130, 115);
      }
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("Thank you for saving with Smart Save!", 105, 140, { align: "center" });
      doc.save(`Receipt_${receipt.receiptNo || receipt.id}.pdf`);
    };

    const generateStatement = () => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Member Statement", 14, 22);
      doc.setFontSize(11);
      doc.text(`Member Name: ${viewingMember.name}`, 14, 30);
      doc.text(`Member ID: ${viewingMember.id}`, 14, 36);
      doc.text(`Plan Duration: ${planDuration} Days`, 14, 42);
      
      autoTable(doc, {
        startY: 50,
        head: [["Date", "Receipt No", "Amount", "Type"]],
        body: memberCols.map(c => [
          new Date(c.timestamp).toLocaleDateString(),
          c.receiptNo || c.id,
          `Rs ${c.amount}`,
          c.type
        ])
      });
      doc.save(`Statement_${viewingMember.id}.pdf`);
    };

    const generateLedger = () => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Member Ledger", 14, 22);
      doc.setFontSize(11);
      doc.text(`Name: ${viewingMember.name} | ID: ${viewingMember.id}`, 14, 30);
      
      autoTable(doc, {
        startY: 40,
        head: [["Date", "Amount", "Savings", "Commission", "Bonus"]],
        body: memberCols.filter(c => c.type !== "Registration Fee").map(c => {
          const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
          return [
            new Date(c.timestamp).toLocaleDateString(),
            `Rs ${c.amount}`,
            `Rs ${breakdown.savingsFund}`,
            `Rs ${breakdown.companyCommission}`,
            `Rs ${breakdown.bonusFund}`,
          ];
        })
      });
      doc.save(`Ledger_${viewingMember.id}.pdf`);
    };

    const generateMaturityReport = () => {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Maturity Report", 14, 22);
      doc.setFontSize(12);
      doc.text(`Name: ${viewingMember.name}`, 14, 35);
      doc.text(`ID: ${viewingMember.id}`, 14, 43);
      doc.text(`Total Deposits: Rs ${totalDeposits}`, 14, 51);
      doc.text(`Total Savings: Rs ${totalSavings}`, 14, 59);
      doc.text(`Total Bonus: Rs ${totalBonus}`, 14, 67);
      doc.text(`Estimated Maturity Amount: Rs ${maturityAmount}`, 14, 75);
      doc.text(`Maturity Date: ${maturityDateObj.toLocaleDateString()}`, 14, 83);
      doc.text(`Remaining Days: ${remainingDays}`, 14, 91);
      doc.save(`Maturity_${viewingMember.id}.pdf`);
    };

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-2xl">
              {viewingMember.name.charAt(0).toUpperCase()}
            </div>
            My Profile
          </h2>
          <div className="flex gap-2">
            <button onClick={generateStatement} className="px-3 py-1.5 text-sm font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Statement</button>
            <button onClick={generateLedger} className="px-3 py-1.5 text-sm font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Ledger</button>
            <button onClick={generateMaturityReport} className="px-3 py-1.5 text-sm font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Maturity</button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-semibold text-slate-800">Plan Progress</h3>
              <p className="text-sm text-slate-500">{totalDaysPaid} / {planDuration} Days Completed</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-[#003366]">{progressPercentage}%</span>
              <span className="text-sm text-slate-500 ml-1">Completed</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 mt-2">
            <div className="bg-[#003366] h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Member ID</p>
                <p className="font-medium text-slate-800">{viewingMember.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Mobile Number</p>
                <p className="font-medium text-slate-800">+91 {viewingMember.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Aadhaar Number</p>
                <p className="font-medium text-slate-800">{viewingMember.aadhaar}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Address</p>
                <p className="font-medium text-slate-800">{viewingMember.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Nominee Name</p>
                <p className="font-medium text-slate-800">{viewingMember.nomineeName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Nominee Mobile</p>
                <p className="font-medium text-slate-800">{viewingMember.nomineePhone || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Plan Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Daily Deposit</p>
                <p className="font-medium text-slate-800">₹{viewingMember.dailyAmount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Date</p>
                <p className="font-medium text-slate-800">{regDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Plan Start Date</p>
                <p className="font-medium text-slate-800">{joinDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Maturity Date</p>
                <p className="font-medium text-emerald-600">{maturityDateObj.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-0.5 ${viewingMember.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                  {viewingMember.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Days Paid</p>
              <p className="font-semibold text-slate-800">{totalDaysPaid} Days</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Remaining Days</p>
              <p className="font-semibold text-slate-800">{remainingDays} Days</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Deposits</p>
              <p className="font-semibold text-slate-800">₹{totalDeposits}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Fee</p>
              <p className="font-semibold text-slate-800">₹{registrationRevenue}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Savings</p>
              <p className="text-2xl font-bold text-[#003366]">₹{totalSavings}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Bonus</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalBonus}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 bg-emerald-50 p-6 rounded-xl text-center">
            <p className="text-emerald-800 font-medium">{totalDaysPaid >= planDuration ? "Plan Matured" : "Estimated Maturity Amount"}</p>
            <p className="text-4xl font-extrabold text-emerald-600 mt-2">₹{maturityAmount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Receipt No</th>
                  <th className="px-6 py-3">Deposit Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {memberCols.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{new Date(c.timestamp).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-500">{c.receiptNo || c.id}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">₹{c.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => downloadReceiptPDF(c)} className="text-[#003366] hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded mr-2" title="Download PDF"><Download className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {memberCols.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No collections found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 relative">
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Members Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all savings fund members and their accounts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#004080] transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Active Filters Bar */}
      {(searchParams.get("registered") === "today" || searchParams.get("status")) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-blue-900">Active Filters:</span>
            {searchParams.get("registered") === "today" && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">Registered Today</span>
            )}
            {searchParams.get("status") && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium border border-blue-200">Status: {searchParams.get("status")}</span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchParams({});
              setStatusFilter("All Status");
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline uppercase tracking-wider cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search members by name, ID or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#003366]"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Member Info</th>
                <th className="px-6 py-4 whitespace-nowrap">Contact</th>
                <th className="px-6 py-4 whitespace-nowrap">Join Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">
                  Total Balance
                </th>
                <th className="px-6 py-4 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => openProfileModal(member)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#003366] font-bold flex items-center justify-center">
                          {member.name
                            ? member.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {member.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      <div>+91 {member.phone}</div>
                      <div className="text-xs text-slate-400">
                        {member.aadhaar}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {member.joinDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                          member.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {member.status === "Active" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        )}
                        {member.status === "Inactive" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5"></span>
                        )}
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-slate-800">
                      {member.balance || "₹0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openProfileModal(member); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(member); }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {(user?.role === "Super Admin" || user?.role === "Administrator") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(member.id); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {paginatedMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(currentPage * itemsPerPage, filteredMembers.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">{filteredMembers.length}</span>{" "}
            results
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-100 bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button className="px-3 py-1 border border-blue-600 bg-blue-50 rounded-md text-sm text-blue-700 font-medium">
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-100 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingMember ? "Edit Member" : "Add New Member"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              {formError && (
                <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Member ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id || "Auto-generated"}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="\d{10}"
                    maxLength={10}
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    placeholder="10 digit number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Aadhaar Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    pattern="\d{12}"
                    maxLength={12}
                    value={formData.aadhaar || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadhaar: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    placeholder="12 digit number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    placeholder="Full address"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plan
                  </label>
                  <select
                    value={formData.plan || "Daily"}
                    onChange={(e) =>
                      setFormData({ ...formData, plan: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily/Plan Amount (₹){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.dailyAmount || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyAmount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joinDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, joinDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status || "Active"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "Active" | "Inactive",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    value={formData.nomineeName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nomineeName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nominee Mobile
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.nomineePhone || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomineePhone: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-[#003366] rounded-lg hover:bg-[#004080] transition-colors shadow-sm"
                >
                  {editingMember ? "Save Changes" : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {viewingMember && (() => {
        const memberCols = collections.filter(c => c.memberId === viewingMember.id);
        const { totalSavings, totalBonus, registrationRevenue, totalCompanyCommission, totalCompanyProfit } = calculateFinancialSummary(memberCols, [viewingMember], settings);
        const maturityAmount = totalSavings + totalBonus;
        
        const regCollection = memberCols.find(c => c.type === "Registration Fee");
        const regDate = regCollection ? new Date(regCollection.timestamp).toLocaleDateString() : new Date(viewingMember.joinDate).toLocaleDateString();
        const regReceipt = regCollection ? (regCollection.receiptNo || regCollection.id) : "N/A";
        const regStatus = regCollection ? regCollection.status : "Paid";

        const planDuration = 180;
        const joinDate = new Date(viewingMember.joinDate);
        const maturityDateObj = new Date(joinDate);
        maturityDateObj.setDate(maturityDateObj.getDate() + planDuration);
        
        const today = new Date();
        const daysPassedObj = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
        const totalDaysPaidObj = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, curr) => acc + (parseInt(curr.amount || "0", 10) / 127), 0);
        const totalDaysPaid = Math.round(totalDaysPaidObj);
        
        const remainingDays = Math.max(0, planDuration - totalDaysPaid);
        const progressPercentage = Math.min(100, Math.round((totalDaysPaid / planDuration) * 100));

        const totalDeposits = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, c) => acc + parseInt(c.amount || "0", 10), 0);

        const printReceipt = (receipt: any) => {
           window.print(); // Simple fallback if they just want a standard print dialog for the screen, but we should generate PDF
        };

        const downloadReceiptPDF = (receipt: any) => {
          const doc = new jsPDF();
          doc.setFontSize(20);
          doc.setTextColor(0, 51, 102);
          doc.text("SMART SAVE FINANCIAL SYSTEMS", 105, 20, { align: "center" });
          doc.setFontSize(12);
          doc.setTextColor(100);
          doc.text("Daily Collection Receipt", 105, 30, { align: "center" });
          doc.setLineWidth(0.5);
          doc.line(20, 35, 190, 35);
          doc.setFontSize(11);
          doc.setTextColor(50);
          doc.text(`Receipt No: ${receipt.receiptNo || receipt.id}`, 20, 50);
          doc.text(`Date: ${new Date(receipt.timestamp).toLocaleString()}`, 130, 50);
          doc.text(`Member ID: ${receipt.memberId}`, 20, 60);
          doc.text(`Member Name: ${receipt.memberName}`, 130, 60);
          doc.text(`Payment Type: ${receipt.type}`, 20, 70);
          doc.text(`Status: ${receipt.status}`, 130, 70);
          doc.setLineWidth(0.5);
          doc.line(20, 80, 190, 80);
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text("Amount Received:", 20, 95);
          doc.setFontSize(16);
          doc.setTextColor(0, 153, 51);
          doc.text(`Rs ${parseInt(receipt.amount, 10).toLocaleString()}`, 130, 95);
          
          if (receipt.type === "Registration Fee") {
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Registration Fee: Rs ${receipt.amount}`, 30, 105);
          } else {
            const breakdown = calculateCollectionBreakdown(parseInt(receipt.amount, 10), receipt.type);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Savings Fund: Rs ${breakdown.savingsFund}`, 30, 105);
            doc.text(`Company Commission: Rs ${breakdown.companyCommission}`, 130, 105);
            doc.text(`Bonus Fund: Rs ${breakdown.bonusFund}`, 30, 115);
            doc.text(`Company Profit: Rs ${breakdown.companyProfit}`, 130, 115);
          }
          doc.setFontSize(10);
          doc.setTextColor(150);
          doc.text("Thank you for saving with Smart Save!", 105, 140, { align: "center" });
          doc.save(`Receipt_${receipt.receiptNo || receipt.id}.pdf`);
        };

        const generateStatement = () => {
          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text("Member Statement", 14, 22);
          doc.setFontSize(11);
          doc.text(`Member Name: ${viewingMember.name}`, 14, 30);
          doc.text(`Member ID: ${viewingMember.id}`, 14, 36);
          doc.text(`Plan Duration: ${planDuration} Days`, 14, 42);
          
          autoTable(doc, {
            startY: 50,
            head: [["Date", "Receipt No", "Amount", "Type"]],
            body: memberCols.map(c => [
              new Date(c.timestamp).toLocaleDateString(),
              c.receiptNo || c.id,
              `Rs ${c.amount}`,
              c.type
            ])
          });
          doc.save(`Statement_${viewingMember.id}.pdf`);
        };

        const generateLedger = () => {
          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text("Member Ledger", 14, 22);
          doc.setFontSize(11);
          doc.text(`Name: ${viewingMember.name} | ID: ${viewingMember.id}`, 14, 30);
          
          autoTable(doc, {
            startY: 40,
            head: [["Date", "Amount", "Savings", "Commission", "Bonus"]],
            body: memberCols.filter(c => c.type !== "Registration Fee").map(c => {
              const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
              return [
                new Date(c.timestamp).toLocaleDateString(),
                `Rs ${c.amount}`,
                `Rs ${breakdown.savingsFund}`,
                `Rs ${breakdown.companyCommission}`,
                `Rs ${breakdown.bonusFund}`,
              ];
            })
          });
          doc.save(`Ledger_${viewingMember.id}.pdf`);
        };

        const generateMaturityReport = () => {
          const doc = new jsPDF();
          doc.setFontSize(18);
          doc.text("Maturity Report", 14, 22);
          doc.setFontSize(12);
          doc.text(`Name: ${viewingMember.name}`, 14, 35);
          doc.text(`ID: ${viewingMember.id}`, 14, 43);
          doc.text(`Total Deposits: Rs ${totalDeposits}`, 14, 51);
          doc.text(`Total Savings: Rs ${totalSavings}`, 14, 59);
          doc.text(`Total Bonus: Rs ${totalBonus}`, 14, 67);
          doc.text(`Estimated Maturity Amount: Rs ${maturityAmount}`, 14, 75);
          doc.text(`Maturity Date: ${maturityDateObj.toLocaleDateString()}`, 14, 83);
          doc.text(`Remaining Days: ${remainingDays}`, 14, 91);
          doc.save(`Maturity_${viewingMember.id}.pdf`);
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xl">
                    {viewingMember.name.charAt(0).toUpperCase()}
                  </div>
                  Member Profile: {viewingMember.name}
                </h2>
                <div className="flex gap-2">
                  <button onClick={generateStatement} className="px-3 py-1.5 text-xs font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Statement</button>
                  <button onClick={generateLedger} className="px-3 py-1.5 text-xs font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Ledger</button>
                  <button onClick={generateMaturityReport} className="px-3 py-1.5 text-xs font-medium text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Maturity</button>
                  <button
                    onClick={handleCloseProfile}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Progress Bar */}
                <div className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">Plan Progress</h3>
                      <p className="text-sm text-slate-500">{totalDaysPaid} / {planDuration} Days Completed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#003366]">{progressPercentage}%</span>
                      <span className="text-sm text-slate-500 ml-1">Completed</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-[#003366] h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div className="space-y-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Member ID</p>
                            <p className="font-medium text-slate-800">{viewingMember.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Mobile Number</p>
                            <p className="font-medium text-slate-800">+91 {viewingMember.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Aadhaar Number</p>
                            <p className="font-medium text-slate-800">{viewingMember.aadhaar}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Address</p>
                            <p className="font-medium text-slate-800">{viewingMember.address || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Nominee Name</p>
                            <p className="font-medium text-slate-800">{viewingMember.nomineeName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Nominee Mobile</p>
                            <p className="font-medium text-slate-800">{viewingMember.nomineePhone || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Plan Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Plan Amount</p>
                            <p className="font-medium text-slate-800">₹22,860</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Daily Deposit</p>
                            <p className="font-medium text-slate-800">₹{viewingMember.dailyAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Date</p>
                            <p className="font-medium text-slate-800">{regDate}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Plan Start Date</p>
                            <p className="font-medium text-slate-800">{joinDate.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Maturity Date</p>
                            <p className="font-medium text-emerald-600">{maturityDateObj.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-0.5 ${viewingMember.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                              {viewingMember.status}
                            </span>
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Financial Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Days Paid</p>
                            <p className="font-semibold text-slate-800">{totalDaysPaid} Days</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Remaining Days</p>
                            <p className="font-semibold text-slate-800">{remainingDays} Days</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Deposits</p>
                            <p className="font-semibold text-slate-800">₹{totalDeposits}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Fee</p>
                            <p className="font-semibold text-slate-800">₹{registrationRevenue}</p>
                          </div>
                          <div className="col-span-2 grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-100">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Savings</p>
                              <p className="font-bold text-[#003366]">₹{totalSavings}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Bonus</p>
                              <p className="font-bold text-purple-600">₹{totalBonus}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">Company Col.</p>
                              <p className="font-bold text-slate-600">₹{totalCompanyCommission}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">Company Profit</p>
                              <p className="font-bold text-slate-700">₹{totalCompanyProfit}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 bg-emerald-50 p-4 rounded-lg">
                          <p className="text-sm text-emerald-800 font-medium">{totalDaysPaid >= planDuration ? "Plan Matured" : "Estimated Maturity Amount"}</p>
                          <p className="text-3xl font-bold text-emerald-600">₹{maturityAmount}</p>
                        </div>
                      </div>
                   </div>
                </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Payment History</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Receipt No</th>
                        <th className="px-4 py-3">Deposit Amount</th>
                        <th className="px-4 py-3">Savings</th>
                        <th className="px-4 py-3">Company Col.</th>
                        <th className="px-4 py-3">Bonus</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {memberCols.map(c => {
                        const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{new Date(c.timestamp).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-500">{c.receiptNo || c.id}</td>
                            <td className="px-4 py-3 font-medium text-emerald-600">₹{c.amount}</td>
                            <td className="px-4 py-3 text-slate-600">₹{breakdown.savingsFund}</td>
                            <td className="px-4 py-3 text-slate-600">₹{breakdown.companyCommission}</td>
                            <td className="px-4 py-3 text-purple-600">₹{breakdown.bonusFund}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{c.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => {
                                if (viewingMember && viewingMember.phone) {
                                  const msg = generateWhatsAppMessage(c, settings);
                                  openWhatsApp(viewingMember.phone, msg);
                                } else {
                                  alert("Member phone number not found.");
                                }
                              }} className="text-emerald-600 hover:text-emerald-800 p-1 mr-1" title="Send WhatsApp Receipt"><MessageCircle className="w-4 h-4" /></button>
                              <button onClick={() => downloadReceiptPDF(c)} className="text-[#003366] hover:text-blue-800 p-1" title="Download PDF"><Download className="w-4 h-4" /></button>
                              <button onClick={() => window.print()} className="text-slate-500 hover:text-slate-800 p-1 ml-1" title="Print Receipt"><Printer className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {memberCols.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No collections found for this member.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
               <button
                  onClick={handleCloseProfile}
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
