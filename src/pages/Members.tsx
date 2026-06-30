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
  MessageCircle,
  AlertCircle,
  Clock,
  Camera,
  User as UserIcon,
  KeyRound
} from "lucide-react";
import { Member } from "../types";
import { useData } from "../context/DataContext";
import { calculateFinancialSummary, calculateCollectionBreakdown, getFinancialConstants } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp, downloadReceiptPDF as downloadReceiptPDFUtil } from "../utils/whatsapp";
import { getMemberDueInfo } from "../utils/reminder";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MemberProfileView from "../components/MemberProfileView";

export default function Members() {
  const { user } = useAuth();
  const { members, collections, addMember, updateMember, deleteMember, addMemberPlan, updateMemberPlanStatus, settings, addCollection, logAudit } = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(() => {
    return searchParams.get("status") || "All Status";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [showAutoReminder, setShowAutoReminder] = useState(true);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Admin Reset Password State
  const [resetPasswordFor, setResetPasswordFor] = useState<{ id: string; name: string } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  
  const handleAdminResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetPasswordError("");

    if (!resetPasswordFor) return;

    if (adminPasswordInput !== (settings?.adminPassword || "Ani@2024")) {
      setResetPasswordError("Incorrect Admin Password.");
      return;
    }

    if (newPasswordInput !== confirmNewPasswordInput) {
      setResetPasswordError("New passwords do not match.");
      return;
    }

    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasNumber = /[0-9]/;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    
    if (!minLength.test(newPasswordInput)) {
      setResetPasswordError("Minimum 8 Characters");
      return;
    }
    if (!hasUpper.test(newPasswordInput)) {
      setResetPasswordError("At least one uppercase letter");
      return;
    }
    if (!hasLower.test(newPasswordInput)) {
      setResetPasswordError("At least one lowercase letter");
      return;
    }
    if (!hasNumber.test(newPasswordInput)) {
      setResetPasswordError("At least one number");
      return;
    }
    if (!hasSpecial.test(newPasswordInput)) {
      setResetPasswordError("At least one special character");
      return;
    }

    updateMember(resetPasswordFor.id, { password: newPasswordInput } as any);
    logAudit("Password Reset", `Password reset for member ${resetPasswordFor.name} by Super Admin`);
    setPaymentSuccessMsg(`Password reset successfully for ${resetPasswordFor.name}.`);
    setTimeout(() => setPaymentSuccessMsg(null), 3000);
    
    setResetPasswordFor(null);
    setAdminPasswordInput("");
    setNewPasswordInput("");
    setConfirmNewPasswordInput("");
  };

  const currentViewingMember = viewingMember ? (members.find(m => m.id === viewingMember.id) || viewingMember) : null;

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAddModal = () => {
    setFormError("");
    setFormData({
      name: "",
      phone: "",
      aadhaar: "",
      address: "",
      plan: "Daily",
      joinDate: new Date().toISOString().split("T")[0],
      planUnits: 1,
      dailyAmount: "127",
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
    setFormData({
      ...member,
      planUnits: member.planUnits || Math.round(parseInt(member.dailyAmount || "127", 10) / 127) || 1,
      dailyAmount: member.dailyAmount || "127"
    });
    setEditingMember(member);
    setIsModalOpen(true);
  };
  
  const openProfileModal = (member: Member) => {
    setViewingMember(member);
  };

  const handleDelete = (id: string) => {
    if (user?.role === "Member") {
      alert("You do not have permission to delete members.");
      return;
    }
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    try {
      deleteMember(deleteConfirmId);
      showNotification("Member deleted successfully.");
      setDeleteConfirmId(null);
    } catch (error) {
      console.error("Failed to delete member:", error);
      alert("Failed to delete member. Please try again.");
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
    if (!m) return false;
    const nameStr = m.name || "";
    const idStr = m.id || "";
    const phoneStr = m.phone || "";
    const matchesSearch =
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneStr.includes(searchQuery);
    const matchesStatus =
      statusFilter === "All Status" || (m.status || "Active") === statusFilter;
    
    // Check if filtered by today's registration
    const filterToday = searchParams.get("registered") === "today";
    const todayStr = new Date().toISOString().split("T")[0];
    const matchesTodayReg = !filterToday || (m.joinDate || "") === todayStr;

    return matchesSearch && matchesStatus && matchesTodayReg;
  });

  // For Member role, render the profile directly
  if (user?.role === "Member" && currentViewingMember) {
    const todayDateStr = new Date().toISOString().split("T")[0];
    const memberDueInfo = getMemberDueInfo(currentViewingMember, collections, todayDateStr);
    
    const activePlans = (currentViewingMember.plans || []).filter(p => p.status === "Active");
    const totalActivePlans = activePlans.length;
    const totalDailyAmount = totalActivePlans * 127;

    const handleInAppPayment = () => {
      addCollection({
        memberId: currentViewingMember.id,
        memberName: currentViewingMember.name,
        amount: totalDailyAmount.toString(),
        type: "Daily Deposit",
        timestamp: new Date().toISOString(),
        status: "Completed",
        notes: "In-App Payment via Auto Reminder"
      });
      setShowAutoReminder(false);
    };

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#16A34A] to-[#14532d]">My Member Portal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <span className="font-bold text-[#16A34A]">{currentViewingMember.name}</span>. Review your plans, savings ledger, and performance details.
          </p>
        </div>

        <MemberProfileView member={currentViewingMember} />

        {/* Automatic App Reminder Popup Modal */}
        {showAutoReminder && !memberDueInfo.paidToday && totalDailyAmount > 0 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-amber-500 p-6 text-white text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7 text-white animate-bounce" />
                </div>
                <h3 className="font-bold text-lg">Daily Payment Pending</h3>
                <p className="text-amber-100 text-xs mt-1">SMART SAVE App Reminder</p>
              </div>
              
              <div className="p-6">
                <p className="text-slate-600 text-sm leading-relaxed text-center font-medium">
                  Dear <span className="font-bold text-slate-800">{currentViewingMember.name}</span>, your daily installment payment is pending for today. Please complete your payment to keep your savings plan active.
                </p>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Due Today</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-0.5">₹{totalDailyAmount}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {totalActivePlans} Active Plan{totalActivePlans > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => setShowAutoReminder(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-100"
                  >
                    Pay Later
                  </button>
                  <button
                    onClick={handleInAppPayment}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEAD_BRANCH_OLD_LAYOUT
  if (false && user && currentViewingMember) {
    const viewingMember = currentViewingMember;
    const memberCols = collections;
    const totalDaysPaid = 180;
    const planDuration = 180;
    const remainingDays = 0;
    const progressPercentage = 100;
    const totalDeposits = 0;
    const registrationRevenue = 0;
    const totalSavings = 0;
    const totalBonus = 0;
    const maturityAmount = 0;
    const paidYesterday = true;
    const paymentSuccessMsg = "";
    const downloadReceiptPDF = (receipt: any) => {};
    const generateStatement = () => {};
    const generateLedger = () => {};
    const generateMaturityReport = () => {};

    const memberDueInfo = { status: "", paidToday: false, dueAmount: 0, fineAmount: 0, lastPaymentDate: "" };
    const totalDailyAmount = 0;
    const totalActivePlans = 0;
    const handleInAppPayment = () => {};
    const regDate = "";
    const joinDate = new Date();
    const maturityDateObj = new Date();
    const isMatured = false;
    const maturityStatus = "";
    const plans: any[] = [];

    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#16A34A] to-[#14532d] text-white flex items-center justify-center font-bold text-2xl">
              {viewingMember.name.charAt(0).toUpperCase()}
            </div>
            My Profile
          </h2>
          <div className="flex gap-2">
            <button onClick={generateStatement} className="px-3 py-1.5 text-sm font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Statement</button>
            <button onClick={generateLedger} className="px-3 py-1.5 text-sm font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Ledger</button>
            <button onClick={generateMaturityReport} className="px-3 py-1.5 text-sm font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1"><Download className="w-4 h-4"/> Maturity</button>
          </div>
        </div>

        {/* Payment Success Alert */}
        {paymentSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-lg text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{paymentSuccessMsg}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-semibold text-slate-800">Plan Progress</h3>
              <p className="text-sm text-slate-500">{totalDaysPaid} / {planDuration} Days Completed</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-[#16A34A]">{progressPercentage}%</span>
              <span className="text-sm text-slate-500 ml-1">Completed</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 mt-2">
            <div className="bg-gradient-to-r from-[#16A34A] to-[#14532d] h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Payment & Dues Center Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center justify-between">
            <span className="text-sm tracking-wide uppercase text-slate-500">Payment & Dues Center</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
              memberDueInfo.status === "Paid" ? "bg-emerald-100 text-emerald-800" :
              memberDueInfo.status === "Due Today" ? "bg-amber-100 text-amber-800" :
              "bg-rose-100 text-rose-800"
            }`}>
              Status: {memberDueInfo.status}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Today's Payment</p>
              <div className="flex items-center gap-2 mt-1.5">
                {memberDueInfo.paidToday ? (
                  <span className="text-emerald-600 font-bold inline-flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4 shrink-0" /> Paid</span>
                ) : (
                  <span className="text-amber-600 font-bold inline-flex items-center gap-1 text-sm">Pending</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Yesterday's Payment</p>
              <div className="flex items-center gap-2 mt-1.5">
                {paidYesterday ? (
                  <span className="text-emerald-600 font-bold inline-flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4 shrink-0" /> Paid</span>
                ) : (
                  <span className="text-rose-600 font-bold inline-flex items-center gap-1 text-sm">Pending</span>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Due</p>
              <p className="text-lg font-extrabold font-mono mt-1 text-rose-600">
                ₹{memberDueInfo.dueAmount}
              </p>
              {memberDueInfo.fineAmount > 0 && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">Includes ₹{memberDueInfo.fineAmount} Fine</p>
              )}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Last Paid Date</p>
              <p className="text-xs font-bold mt-2.5 text-slate-700">
                {memberDueInfo.lastPaymentDate}
              </p>
            </div>
          </div>

          {/* Quick Pay Button */}
          {!memberDueInfo.paidToday && totalDailyAmount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Payment Due</p>
                <p className="text-sm font-semibold text-amber-700 mt-1">Amount: ₹{totalDailyAmount} ({totalActivePlans} Active Plan{totalActivePlans > 1 ? "s" : ""})</p>
              </div>
              <button 
                onClick={handleInAppPayment}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Pay Now (₹{totalDailyAmount})
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Personal Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Member ID</p>
                <p className="font-medium text-slate-800">{viewingMember.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Member Name</p>
                <p className="font-medium text-slate-800">{viewingMember.name}</p>
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
                <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Status</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-0.5 bg-emerald-100 text-emerald-700">
                  {viewingMember.registrationStatus || "Verified"}
                </span>
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

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Plan Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Active Plans</p>
                <p className="font-semibold text-[#16A34A]">{totalActivePlans}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Daily Amount</p>
                <p className="font-semibold text-[#16A34A]">₹{totalDailyAmount}</p>
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
                <p className="text-xs text-slate-500 uppercase tracking-wider">Maturity Status</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center mt-0.5 ${isMatured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {maturityStatus}
                </span>
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

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
          <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">My Plans</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.id}</p>
                  <p className="text-xs text-slate-500 mt-1">Daily Deposit: <span className="font-semibold">₹{p.dailyAmount}</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">Started: {new Date(p.startDate).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  p.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                  p.status === "Paused" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-200 text-slate-700"
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
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
              <p className="text-2xl font-bold text-[#16A34A]">₹{totalSavings}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Bonus</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalBonus}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100 bg-emerald-50 p-6 rounded-2xl text-center">
            <p className="text-emerald-800 font-medium">{totalDaysPaid >= planDuration ? "Plan Matured" : "Estimated Maturity Amount"}</p>
            <p className="text-4xl font-extrabold text-emerald-600 mt-2">₹{maturityAmount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">Payment History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
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
                      <button onClick={() => downloadReceiptPDF(c)} className="text-[#16A34A] hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded mr-2" title="Download PDF"><Download className="w-4 h-4" /></button>
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

        {/* Automatic App Reminder Popup Modal */}
        {showAutoReminder && !memberDueInfo.paidToday && totalDailyAmount > 0 && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Top Warning Banner */}
              <div className="bg-amber-500 p-6 text-white text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="w-7 h-7 text-white animate-bounce" />
                </div>
                <h3 className="font-bold text-lg">Daily Payment Pending</h3>
                <p className="text-amber-100 text-xs mt-1">SMART SAVE App Reminder</p>
              </div>
              
              <div className="p-6">
                <p className="text-slate-600 text-sm leading-relaxed text-center font-medium">
                  Dear <span className="font-bold text-slate-800">{viewingMember.name}</span>, your daily installment payment is pending for today. Please complete your payment to keep your savings plan active.
                </p>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount Due Today</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-0.5">₹{totalDailyAmount}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    {totalActivePlans} Active Plan{totalActivePlans > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => setShowAutoReminder(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-100"
                  >
                    Pay Later
                  </button>
                  <button
                    onClick={handleInAppPayment}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#16A34A] to-[#14532d]">
            Members Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage all savings fund members and their accounts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-[#16A34A] to-[#14532d] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-[#15803d] hover:to-[#166534] transition-colors shadow-lg flex items-center gap-2"
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
            className="text-xs font-bold text-[#16A34A] hover:text-blue-800 underline uppercase tracking-wider cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow border border-slate-100 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
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
            <thead className="bg-white border-b border-slate-100 text-slate-600 font-medium">
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#16A34A] font-bold flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                          {member.photo ? (
                            <img 
                              src={member.photo} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : member.name ? (
                            member.name.charAt(0).toUpperCase()
                          ) : (
                            "?"
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>ID: {member.id}</span>
                            <span className="text-slate-300">|</span>
                            <span className="bg-blue-50 text-[#14532d] px-1 py-0.2 rounded text-[10px] font-medium font-mono">
                              {member.plans ? member.plans.filter((p: any) => p.status === "Active").length : 1} Plan(s) (₹{member.dailyAmount}/day)
                            </span>
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
                          className="p-1.5 text-[#16A34A] hover:bg-blue-50 rounded-md transition-colors"
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
                        {user?.role === "Super Admin" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setResetPasswordFor({ id: member.id, name: member.name }); }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )}
                        {user?.role === "Super Admin" && (
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
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
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
            <button className="px-3 py-1 border border-blue-600 bg-blue-50 rounded-md text-sm text-[#14532d] font-medium">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
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
                <div className="md:col-span-2">
                  <div className="flex flex-col md:flex-row items-center gap-4 border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-full border border-slate-100 overflow-hidden bg-white flex items-center justify-center shadow-xs">
                        {formData.photo ? (
                          <img 
                            src={formData.photo} 
                            alt="Member Photo Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-[#16A34A] to-[#14532d] text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-800 transition-colors shadow-xs">
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
                          <Trash2 className="w-3 px-0 py-0" /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                    Plan Name
                  </label>
                  <select
                    value={formData.plan || "Daily"}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                  >
                    <option value="Daily">Basic Daily Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Plan Units
                  </label>
                  <select
                    value={formData.planUnits || 1}
                    onChange={(e) => {
                      const units = parseInt(e.target.value, 10);
                      setFormData({
                        ...formData,
                        planUnits: units,
                        dailyAmount: (units * 127).toString()
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                  >
                    <option value="1">1 Unit (₹127/day)</option>
                    <option value="2">2 Units (₹254/day)</option>
                    <option value="3">3 Units (₹381/day)</option>
                    <option value="4">4 Units (₹508/day)</option>
                    <option value="5">5 Units (₹635/day)</option>
                    <option value="10">10 Units (₹1270/day)</option>
                    <option value="15">15 Units (₹1905/day)</option>
                    <option value="20">20 Units (₹2540/day)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Daily/Plan Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    readOnly
                    value={formData.dailyAmount || "127"}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
                    placeholder="127"
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
                {user?.role === "Super Admin" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Account Access Status (Security)
                    </label>
                    <select
                      value={formData.accountStatus || "Active"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountStatus: e.target.value as "Active" | "Inactive" | "Locked" | "Disabled",
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Locked">Locked</option>
                      <option value="Disabled">Disabled</option>
                    </select>
                  </div>
                )}
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

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#16A34A] to-[#14532d] rounded-lg hover:from-[#15803d] hover:to-[#166534] transition-colors shadow-lg"
                >
                  {editingMember ? "Save Changes" : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {currentViewingMember && (() => {
        const viewingMember = currentViewingMember;
        const memberCols = collections.filter(c => c.memberId === viewingMember.id);
        const { totalSavings, totalBonus, registrationRevenue, totalCompanyCommission, totalCompanyProfit } = calculateFinancialSummary(memberCols, [viewingMember], settings);
        const maturityAmount = totalSavings + totalBonus;
        const modalDueInfo = getMemberDueInfo(viewingMember, collections);
        
        const plans = viewingMember.plans || [
          {
            id: `${viewingMember.id}-PLAN-1`,
            dailyAmount: parseInt(viewingMember.dailyAmount || "127", 10),
            status: viewingMember.status === "Active" ? "Active" : "Closed",
            startDate: viewingMember.joinDate
          }
        ];
        const activePlans = plans.filter(p => p.status === "Active");
        const totalActivePlans = activePlans.length;
        const totalDailyAmount = activePlans.reduce((sum, p) => sum + p.dailyAmount, 0);

        const regCollection = memberCols.find(c => c.type === "Registration Fee");
        const regDate = regCollection ? new Date(regCollection.timestamp).toLocaleDateString() : new Date(viewingMember.joinDate).toLocaleDateString();
        const regReceipt = regCollection ? (regCollection.receiptNo || regCollection.id) : "N/A";
        const regStatus = regCollection ? regCollection.status : "Paid";

        const planDuration = 180;
        const joinDate = new Date(viewingMember.joinDate);
        const maturityDateObj = new Date(joinDate);
        maturityDateObj.setFullYear(maturityDateObj.getFullYear() + 3);
        const isMatured = new Date() >= maturityDateObj;
        const maturityStatus = isMatured ? "Matured" : "Accumulating";
        
        const today = new Date();
        const daysPassedObj = Math.floor((today.getTime() - joinDate.getTime()) / (1000 * 3600 * 24));
        const totalDaysPaidObj = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, curr) => acc + (parseInt(curr.amount || "0", 10) / 127), 0);
        const totalDaysPaid = Math.round(totalDaysPaidObj);
        
        const remainingDays = Math.max(0, planDuration - totalDaysPaid);
        const progressPercentage = Math.min(100, Math.round((totalDaysPaid / planDuration) * 100));

        const totalDeposits = memberCols.filter(c => c.type === "Daily Deposit").reduce((acc, c) => acc + parseInt(c.amount || "0", 10), 0);

        const printReceipt = (receipt: any) => {
           window.print();
           logAudit("Receipt Printed", `Receipt ${receipt.receiptNo || receipt.id} was printed`, "Members");
        };

        const downloadReceiptPDF = (receipt: any) => {
          downloadReceiptPDFUtil(receipt, settings, "download");
          logAudit("Receipt Downloaded", `Receipt ${receipt.receiptNo || receipt.id} was downloaded`, "Members");
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
              c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "N/A",
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
                c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "N/A",
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
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#16A34A] to-[#14532d] text-white flex items-center justify-center font-bold text-xl">
                    {viewingMember.name.charAt(0).toUpperCase()}
                  </div>
                  Member Profile: {viewingMember.name}
                </h2>
                <div className="flex gap-2">
                  <button onClick={generateStatement} className="px-3 py-1.5 text-xs font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Statement</button>
                  <button onClick={generateLedger} className="px-3 py-1.5 text-xs font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Ledger</button>
                  <button onClick={generateMaturityReport} className="px-3 py-1.5 text-xs font-medium text-[#16A34A] bg-blue-50 hover:bg-blue-100 rounded-md flex items-center gap-1"><Download className="w-3 h-3"/> Maturity</button>
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
                <div className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">Plan Progress</h3>
                      <p className="text-sm text-slate-500">{totalDaysPaid} / {planDuration} Days Completed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-[#16A34A]">{progressPercentage}%</span>
                      <span className="text-sm text-slate-500 ml-1">Completed</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-[#16A34A] to-[#14532d] h-3 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div className="space-y-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Personal Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Member ID</p>
                            <p className="font-medium text-slate-800">{viewingMember.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Member Name</p>
                            <p className="font-medium text-slate-800">{viewingMember.name}</p>
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
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Registration Status</p>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-0.5 bg-emerald-100 text-emerald-700">
                              {viewingMember.registrationStatus || "Verified"}
                            </span>
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

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Plan Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Active Plans</p>
                            <p className="font-semibold text-[#16A34A]">{totalActivePlans}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Daily Amount</p>
                            <p className="font-semibold text-[#16A34A]">₹{totalDailyAmount}</p>
                          </div>
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
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Maturity Status</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center mt-0.5 ${isMatured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {maturityStatus}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center mt-0.5 ${viewingMember.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                              {viewingMember.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                          <h3 className="font-bold text-slate-800">Active Plans & Management</h3>
                          {(user?.role === "Super Admin" || user?.role === "Administrator") && (
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to purchase a new ₹127 Plan for this member?")) {
                                  addMemberPlan(viewingMember.id, 127);
                                  showNotification("New ₹127 Plan added successfully!");
                                }
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-lg transition-colors"
                            >
                              + Add ₹127 Plan
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {plans.map((p) => (
                            <div key={p.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{p.id}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-500 font-mono">Daily: ₹{p.dailyAmount}</span>
                                  <span className="text-xs text-slate-400">|</span>
                                  <span className="text-xs text-slate-500">Since: {new Date(p.startDate).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  p.status === "Active" ? "bg-emerald-100 text-emerald-700" :
                                  p.status === "Paused" ? "bg-amber-100 text-amber-700" :
                                  "bg-slate-200 text-slate-700"
                                }`}>
                                  {p.status}
                                </span>
                                
                                {(user?.role === "Super Admin" || user?.role === "Administrator") && p.status !== "Closed" && (
                                  <div className="flex gap-1">
                                    {p.status === "Active" ? (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to pause plan ${p.id}?`)) {
                                            updateMemberPlanStatus(viewingMember.id, p.id, "Paused");
                                            showNotification(`Plan ${p.id} paused successfully!`);
                                          }
                                        }}
                                        className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200"
                                        title="Pause Plan"
                                      >
                                        Pause
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to resume plan ${p.id}?`)) {
                                            updateMemberPlanStatus(viewingMember.id, p.id, "Active");
                                            showNotification(`Plan ${p.id} resumed successfully!`);
                                          }
                                        }}
                                        className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200"
                                        title="Resume Plan"
                                      >
                                        Resume
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to CLOSE plan ${p.id}? This cannot be undone.`)) {
                                          updateMemberPlanStatus(viewingMember.id, p.id, "Closed");
                                          showNotification(`Plan ${p.id} closed successfully!`);
                                        }
                                      }}
                                      className="px-1.5 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 rounded border border-rose-200"
                                      title="Close Plan"
                                    >
                                      Close
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg">
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
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Total Due Amount</p>
                            <p className="font-semibold text-rose-600">₹{modalDueInfo.dueAmount}</p>
                          </div>
                          {modalDueInfo.fineAmount > 0 && (
                            <div>
                              <p className="text-xs text-red-500 uppercase tracking-wider font-bold">Unpaid Fine</p>
                              <p className="font-semibold text-red-600">₹{modalDueInfo.fineAmount}</p>
                            </div>
                          )}
                          <div className="col-span-2 grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-100">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider">Total Savings</p>
                              <p className="font-bold text-[#16A34A]">₹{totalSavings}</p>
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
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
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
                              <button onClick={() => downloadReceiptPDF(c)} className="text-[#16A34A] hover:text-blue-800 p-1" title="Download PDF"><Download className="w-4 h-4" /></button>
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
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0 rounded-b-xl">
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Member</h3>
                  <p className="text-sm text-slate-500">Permanently remove this member profile.</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to delete this member?
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
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Password</h3>
              <p className="text-sm text-slate-500 mb-6">Resetting password for {resetPasswordFor.name}</p>
              
              {resetPasswordError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 mb-4 text-center">
                  {resetPasswordError}
                </div>
              )}
              
              <form onSubmit={handleAdminResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Current Admin Password</label>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="mt-1 focus:ring-[#003366] focus:border-[#003366] block w-full sm:text-sm border-slate-300 rounded-lg py-2.5 border bg-slate-50 outline-none"
                    placeholder="Enter your admin password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="mt-1 focus:ring-[#003366] focus:border-[#003366] block w-full sm:text-sm border-slate-300 rounded-lg py-2.5 border bg-slate-50 outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                  <input
                    type="text"
                    required
                    value={confirmNewPasswordInput}
                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                    className="mt-1 focus:ring-[#003366] focus:border-[#003366] block w-full sm:text-sm border-slate-300 rounded-lg py-2.5 border bg-slate-50 outline-none"
                  />
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setResetPasswordFor(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#16A34A] to-[#14532d] rounded-lg hover:from-[#15803d] hover:to-[#166534] transition-colors shadow-lg"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
