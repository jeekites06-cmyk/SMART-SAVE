import React, { useState, useMemo } from "react";
import { 
  User as UserIcon, 
  Phone, 
  FileText, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Minus, 
  Pause, 
  Play, 
  Square, 
  AlertCircle, 
  X, 
  Download, 
  MessageCircle, 
  Printer, 
  ArrowRight, 
  ClipboardList, 
  Shield, 
  Camera, 
  Trash2,
  Coins, 
  CreditCard,
  History,
  FileSpreadsheet
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getMemberDueInfo } from "../utils/reminder";
import { calculateFinancialSummary, calculateCollectionBreakdown } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp, downloadReceiptPDF as downloadReceiptPDFUtil } from "../utils/whatsapp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Member, Collection, MemberPlan } from "../types";

interface MemberProfileViewProps {
  member: Member;
  onClose?: () => void;
}

export default function MemberProfileView({ member, onClose }: MemberProfileViewProps) {
  const { user } = useAuth();
  const { 
    members, 
    collections, 
    updateMember, 
    addMemberPlan, 
    updateMemberPlanStatus, 
    settings, 
    addCollection,
    reminderHistory,
    auditLogs
  } = useData();

  // Keep member details reactively updated
  const viewingMember = useMemo(() => {
    return members.find(m => m.id === member.id) || member;
  }, [members, member]);

  // Tab State for History
  const [activeTab, setActiveTab] = useState<"payment" | "receipt" | "reminder" | "audit">("payment");

  // Dialog / Form States
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectDays, setCollectDays] = useState<number>(1);
  const [collectNotes, setCollectNotes] = useState("");
  const [collectReceiptNo, setCollectReceiptNo] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Print Card Preview Modal
  const [showPrintCard, setShowPrintCard] = useState(false);

  // Calculations
  const memberCols = useMemo(() => {
    return collections.filter(c => c.memberId === viewingMember.id);
  }, [collections, viewingMember.id]);

  const { totalSavings, totalBonus, registrationRevenue, totalCompanyCommission, totalCompanyProfit } = useMemo(() => {
    return calculateFinancialSummary(memberCols, [viewingMember], settings);
  }, [memberCols, viewingMember, settings]);

  const plans = useMemo(() => {
    return viewingMember.plans || [
      {
        id: `${viewingMember.id}-PLAN-1`,
        dailyAmount: parseInt(viewingMember.dailyAmount || "127", 10),
        status: viewingMember.status === "Active" ? "Active" : "Closed" as const,
        startDate: viewingMember.joinDate
      }
    ];
  }, [viewingMember]);

  const activePlans = useMemo(() => {
    return plans.filter(p => p.status === "Active");
  }, [plans]);

  const totalActivePlans = activePlans.length;
  const currentDailyDepositUnit = 127;
  const totalDailyAmount = totalActivePlans * currentDailyDepositUnit;

  const regCollection = useMemo(() => {
    return memberCols.find(c => c.type === "Registration Fee");
  }, [memberCols]);

  const regDate = useMemo(() => {
    return regCollection 
      ? new Date(regCollection.timestamp).toLocaleDateString() 
      : new Date(viewingMember.joinDate).toLocaleDateString();
  }, [regCollection, viewingMember.joinDate]);

  const planDuration = 180;
  const joinDate = new Date(viewingMember.joinDate);
  const maturityDateObj = useMemo(() => {
    const d = new Date(joinDate);
    d.setFullYear(d.getFullYear() + 3);
    return d;
  }, [joinDate]);

  const isMatured = useMemo(() => {
    return new Date() >= maturityDateObj;
  }, [maturityDateObj]);

  const maturityStatus = isMatured ? "Matured" : "Accumulating";

  // Calculations for deposit collections
  const dailyCols = useMemo(() => {
    return memberCols.filter(c => c.type === "Daily Deposit" || c.type === "Daily Collection");
  }, [memberCols]);

  const totalCollections = useMemo(() => {
    return dailyCols.reduce((sum, c) => sum + parseInt(c.amount || "0", 10), 0);
  }, [dailyCols]);

  const totalSavingsCalculated = useMemo(() => {
    return dailyCols.reduce((sum, c) => {
      const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
      return sum + breakdown.savingsFund;
    }, 0);
  }, [dailyCols]);

  const totalCompanyCollectionCalculated = useMemo(() => {
    return dailyCols.reduce((sum, c) => {
      const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
      return sum + breakdown.companyCommission;
    }, 0);
  }, [dailyCols]);

  const totalPaidDaysCalculated = useMemo(() => {
    // Each day deposit matches currentDailyDepositUnit. Total paid days = totalCollections / (unit amount * active units during payment)
    // For simplicity, total paid days is based on sum of deposits divided by the single unit amount, reflecting unit-days paid.
    // Since each unit paid counts as a day-unit.
    return Math.round(totalCollections / 127);
  }, [totalCollections]);

  const totalPaidDays = totalPaidDaysCalculated;
  const remainingDays = Math.max(0, planDuration - totalPaidDays);
  const progressPercentage = Math.min(100, Math.round((totalPaidDays / planDuration) * 100));

  const todayDateStr = new Date().toISOString().split("T")[0];
  const dueInfo = useMemo(() => {
    return getMemberDueInfo(viewingMember, collections, todayDateStr);
  }, [viewingMember, collections, todayDateStr]);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const paidYesterday = useMemo(() => {
    return collections.some(c => 
      c.memberId === viewingMember.id && 
      (c.type === "Daily Deposit" || c.type === "Daily Collection") && 
      c.timestamp.startsWith(yesterdayStr)
    );
  }, [collections, viewingMember.id, yesterdayStr]);

  const lastReceiptNo = useMemo(() => {
    const sorted = [...dailyCols].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sorted.length > 0 ? (sorted[0].receiptNo || sorted[0].id) : "N/A";
  }, [dailyCols]);

  // Filter reminder history
  const filteredReminders = useMemo(() => {
    return reminderHistory.filter(r => r.memberId === viewingMember.id);
  }, [reminderHistory, viewingMember.id]);

  // Filter audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.details.includes(viewingMember.id) || 
      log.details.includes(viewingMember.name)
    );
  }, [auditLogs, viewingMember.id, viewingMember.name]);

  // Handle local Photo Upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const base64String = reader.result as string;
        updateMember(viewingMember.id, { photo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  // ACTIONS
  const handleCollectPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectDays <= 0) return;

    const unitAmount = totalDailyAmount > 0 ? totalDailyAmount : 127;
    const finalAmount = collectDays * unitAmount;

    // Generate standard RCT receipt prefix
    const receiptPrefix = settings?.receiptPrefix || "RCT";
    const receiptSerial = Math.floor(100000 + Math.random() * 900000);
    const generatedReceiptNo = collectReceiptNo || `${receiptPrefix}${receiptSerial}`;

    const newCol = addCollection({
      memberId: viewingMember.id,
      memberName: viewingMember.name,
      amount: finalAmount.toString(),
      type: "Daily Deposit",
      timestamp: new Date().toISOString(),
      status: "Completed",
      notes: collectNotes || `Deposit for ${collectDays} Day(s) via Profile Module`,
      receiptNo: generatedReceiptNo,
      collectedBy: user?.username || "admin",
      collectedByName: user?.name || "Admin"
    } as any);

    setPaymentSuccessMsg(`Successfully collected ₹${finalAmount} for ${collectDays} Day(s)! Receipt No: ${newCol.receiptNo}`);
    setShowCollectModal(false);
    setCollectDays(1);
    setCollectNotes("");
    setCollectReceiptNo("");

    // Clear alert after 6 seconds
    setTimeout(() => {
      setPaymentSuccessMsg(null);
    }, 6000);
  };

  const handleShareWhatsApp = () => {
    if (dailyCols.length === 0) {
      alert("No payments found to generate a ledger summary.");
      return;
    }
    const sorted = [...dailyCols].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestReceipt = sorted[0];
    const msg = generateWhatsAppMessage(latestReceipt, settings || {});
    openWhatsApp(viewingMember.phone, msg);
  };

  const handlePrintMemberCard = () => {
    setShowPrintCard(true);
  };

  const triggerPrintWindow = () => {
    const printContent = document.getElementById("printable-member-card")?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Print Member Card - ${viewingMember.name}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body class="bg-white p-8 flex items-center justify-center min-h-screen">
              <div class="border-2 border-[#003366] rounded-2xl p-6 w-[450px] bg-slate-50 relative overflow-hidden shadow-lg font-sans">
                ${printContent}
              </div>
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const handleDownloadMemberPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 51, 102); // #003366 Navy
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("SMART SAVE", 14, 25);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text("MEMBER PROFILE REPORT", 14, 32);
    
    // Current date
    doc.setFontSize(9);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 145, 25);
    doc.text("Status: Verified Account", 145, 32);

    // Profile Details Section
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("1. MEMBER IDENTIFICATION", 14, 52);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 55, 196, 55);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const leftColX = 14;
    const rightColX = 110;
    let y = 64;

    doc.setFont("Helvetica", "bold"); doc.text("Member ID:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(viewingMember.id, leftColX + 35, y);
    doc.setFont("Helvetica", "bold"); doc.text("Aadhaar Number:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(viewingMember.aadhaar || "N/A", rightColX + 40, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Full Name:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(viewingMember.name, leftColX + 35, y);
    doc.setFont("Helvetica", "bold"); doc.text("Mobile Number:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`+91 ${viewingMember.phone}`, rightColX + 40, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Address:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(viewingMember.address || "N/A", leftColX + 35, y);
    doc.setFont("Helvetica", "bold"); doc.text("Registration Date:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(regDate, rightColX + 40, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Status:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(viewingMember.status, leftColX + 35, y);
    doc.setFont("Helvetica", "bold"); doc.text("Reg Fee Status:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text("Paid (₹2500)", rightColX + 40, y);

    // Plan Details Section
    y += 16;
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("2. PLAN UNITS & COMPOSITION", 14, y);
    
    doc.line(14, y + 3, 196, y + 3);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    y += 12;
    doc.setFont("Helvetica", "bold"); doc.text("Active Units:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(`${totalActivePlans} Unit(s)`, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Daily Savings Total:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalActivePlans * 102}`, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Daily Deposit Total:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalDailyAmount}`, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Daily Company Total:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalActivePlans * 25}`, rightColX + 45, y);

    // Payment Summary Section
    y += 16;
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("3. COLLECTION & PAYMENT SUMMARY", 14, y);
    
    doc.line(14, y + 3, 196, y + 3);

    y += 12;
    doc.setFont("Helvetica", "bold"); doc.text("Today's Payment:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(dueInfo.paidToday ? "Paid" : "Pending", leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Pending Days:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`${dueInfo.dueDays} Days`, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Yesterday's Payment:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(paidYesterday ? "Paid" : "Pending", leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Due Amount:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${dueInfo.dueAmount}`, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Last Payment Date:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(dueInfo.lastPaymentDate, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Fine Amount:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${dueInfo.fineAmount}`, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Total Paid Days:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(`${totalPaidDays} / 180 Days`, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Total Collections:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalCollections}`, rightColX + 45, y);

    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Remaining Days:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(`${remainingDays} Days`, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Total Savings Ledger:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalSavingsCalculated}`, rightColX + 45, y);

    // Maturity Section
    y += 16;
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.setFont("Helvetica", "bold");
    doc.text("4. THREE YEAR MATURITY PROJECTION", 14, y);
    
    doc.line(14, y + 3, 196, y + 3);

    y += 12;
    doc.setFont("Helvetica", "bold"); doc.text("Maturity Date:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(maturityDateObj.toLocaleDateString(), leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Maturity Status:", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(maturityStatus, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Savings Portion:", leftColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${totalSavingsCalculated}`, leftColX + 45, y);
    doc.setFont("Helvetica", "bold"); doc.text("Maturity Bonus (60%):", rightColX, y); doc.setFont("Helvetica", "normal"); doc.text(`Rs ${Math.round(totalSavingsCalculated * 0.60)}`, rightColX + 45, y);
    
    y += 8;
    doc.setFont("Helvetica", "bold"); doc.text("Total Projected Maturity:", leftColX, y); doc.setFont("Helvetica", "bold"); doc.setTextColor(0, 128, 0); doc.text(`Rs ${Math.round(totalSavingsCalculated * 1.60)}`, leftColX + 45, y);
    doc.setTextColor(50, 50, 50);

    // Footer note
    y += 20;
    doc.setFontSize(8);
    doc.setFont("Helvetica", "italic");
    doc.text("This document is a computer-generated summary of the Smart Save savings plan ledger and is valid for auditing.", 14, y);
    doc.text("Keep saving, keep growing with Smart Save Basic Plan.", 14, y + 4);

    doc.save(`Member_Profile_${viewingMember.id}.pdf`);
  };

  // ADMIN PLAN MANAGEMENT ACTIONS
  const handleIncreaseUnits = () => {
    if (viewingMember.status !== "Active") {
      alert("Please resume the membership before modifying plan units.");
      return;
    }
    const confirm = window.confirm(`Are you sure you want to purchase an additional ₹127 Plan Unit for ${viewingMember.name}?`);
    if (confirm) {
      addMemberPlan(viewingMember.id, 127);
    }
  };

  const handleDecreaseUnits = () => {
    const activePlans = plans.filter(p => p.status === "Active");
    if (activePlans.length <= 1) {
      alert("Member must have at least 1 active plan unit. To pause all, use the 'Pause Membership' action instead.");
      return;
    }
    const confirm = window.confirm(`Are you sure you want to decrease plan units for ${viewingMember.name}? This will close the latest active unit.`);
    if (confirm) {
      const lastActive = activePlans[activePlans.length - 1];
      updateMemberPlanStatus(viewingMember.id, lastActive.id, "Closed");
    }
  };

  const handlePauseMembership = () => {
    const activePlans = plans.filter(p => p.status === "Active");
    if (activePlans.length === 0) {
      alert("No active plans to pause.");
      return;
    }
    const confirm = window.confirm(`Are you sure you want to PAUSE the entire membership for ${viewingMember.name}? This will pause all active plan units.`);
    if (confirm) {
      activePlans.forEach(p => {
        updateMemberPlanStatus(viewingMember.id, p.id, "Paused");
      });
      updateMember(viewingMember.id, { status: "Inactive" });
    }
  };

  const handleResumeMembership = () => {
    const pausedPlans = plans.filter(p => p.status === "Paused");
    if (pausedPlans.length === 0) {
      // If no paused plans exist, check if there's any plan at all
      const inactivePlans = plans.filter(p => p.status !== "Closed");
      if (inactivePlans.length === 0) {
        alert("No paused or inactive plans found to resume. You can add a new ₹127 Plan Unit.");
        return;
      }
      // Resume whatever is inactive
      inactivePlans.forEach(p => {
        updateMemberPlanStatus(viewingMember.id, p.id, "Active");
      });
    } else {
      pausedPlans.forEach(p => {
        updateMemberPlanStatus(viewingMember.id, p.id, "Active");
      });
    }
    updateMember(viewingMember.id, { status: "Active" });
  };

  const handleCloseMembership = () => {
    const nonClosedPlans = plans.filter(p => p.status !== "Closed");
    if (nonClosedPlans.length === 0) {
      alert("Membership is already closed.");
      return;
    }
    const confirm = window.confirm(`CRITICAL WARNING: Are you sure you want to CLOSE the entire membership for ${viewingMember.name}? This will permanently close all active and paused plan units. This action cannot be undone.`);
    if (confirm) {
      nonClosedPlans.forEach(p => {
        updateMemberPlanStatus(viewingMember.id, p.id, "Closed");
      });
      updateMember(viewingMember.id, { status: "Inactive" });
    }
  };

  // Check if admin
  const isAdmin = user?.role === "Super Admin" || user?.role === "Administrator";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" id="member-profile-module">
      {/* Alert Banner for Payment Success */}
      {paymentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm text-sm animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left column (display details + plans), Right column (summary + maturity) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Profile & Plan Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* MEMBER PROFILE SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 h-2 w-full bg-[#003366]" />
            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider mb-5 pb-3 border-b border-slate-100 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#003366]" /> Member Profile Card
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Photo Area */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl border-4 border-slate-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                    {viewingMember.photo ? (
                      <img 
                        src={viewingMember.photo} 
                        alt={viewingMember.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center">
                        <UserIcon className="w-12 h-12 text-slate-300 mx-auto" />
                        <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">No Photo</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-[#003366] text-white p-2 rounded-full cursor-pointer hover:bg-blue-800 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp" 
                      className="hidden" 
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
                {viewingMember.photo && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this profile photo?")) {
                        updateMember(viewingMember.id, { photo: "" });
                      }
                    }}
                    className="mt-3 text-xs font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                  </button>
                )}
              </div>

              {/* Bio Grid */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Member ID</p>
                  <p className="font-mono text-base font-bold text-slate-800 mt-0.5">{viewingMember.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Full Name</p>
                  <p className="font-bold text-slate-800 text-base mt-0.5">{viewingMember.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mobile Number</p>
                  <p className="font-semibold text-slate-800 mt-0.5">+91 {viewingMember.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Aadhaar Number</p>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">
                    {viewingMember.aadhaar ? viewingMember.aadhaar.replace(/(\d{4})/g, "$1 ").trim() : "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Residential Address</p>
                  <p className="font-medium text-slate-700 mt-0.5 leading-relaxed">{viewingMember.address || "No address added."}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registration Date</p>
                  <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {regDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registration Status</p>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center mt-1 bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Registered
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verification Status</p>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center mt-1 bg-blue-50 text-blue-700 border border-blue-100">
                    <Shield className="w-3 h-3 mr-1" /> Verified Account
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registration Fee Paid</p>
                  <p className="font-bold text-emerald-600 text-sm mt-1">₹2,500 <span className="text-[10px] text-slate-400 font-semibold">(One-time Fee)</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* PLAN DETAILS SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" /> Plan Composition Details
            </h3>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-5">
              <h4 className="font-bold text-slate-800 text-sm">SMART SAVE BASIC PLAN</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                The absolute standard financial layout structure: 180 Days maturity cycle with 3 Years holding period.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs font-medium text-slate-600">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Daily Deposit</span>
                  <span className="font-extrabold text-slate-800 text-sm">₹127 / Unit</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Member Savings</span>
                  <span className="font-extrabold text-emerald-600 text-sm">₹102 / Unit</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Company Collection</span>
                  <span className="font-extrabold text-slate-700 text-sm">₹25 / Unit</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Payment Duration</span>
                  <span className="font-extrabold text-slate-800 text-sm">180 Days</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Holding Period</span>
                  <span className="font-extrabold text-slate-800 text-sm">3 Years</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block font-semibold uppercase text-[9px]">Maturity Bonus</span>
                  <span className="font-extrabold text-purple-600 text-sm">60%</span>
                </div>
              </div>
            </div>

            {/* Live Units Summary Cards */}
            <h5 className="font-bold text-slate-500 text-xs uppercase tracking-wider mb-3">Your Subscribed Plan Units</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-center">
                <span className="text-[10px] text-blue-500 font-extrabold uppercase tracking-widest">Active Units</span>
                <span className="block font-black text-2xl text-[#003366] mt-1">{totalActivePlans}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Daily Deposit</span>
                <span className="block font-black text-xl text-slate-800 mt-1">₹{totalDailyAmount}</span>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                <span className="text-[10px] text-emerald-500 font-extrabold uppercase tracking-widest">Daily Savings</span>
                <span className="block font-black text-xl text-emerald-600 mt-1">₹{totalActivePlans * 102}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Daily Company</span>
                <span className="block font-black text-xl text-slate-700 mt-1">₹{totalActivePlans * 25}</span>
              </div>
            </div>

            {/* Unlimited Plan Units Illustrative Table */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Plan Pricing Table (Example scale)</span>
              <div className="grid grid-cols-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-50">
                <div>Scale Units</div>
                <div>Deposit (₹127)</div>
                <div>Savings (₹102)</div>
                <div>Company (₹25)</div>
              </div>
              <div className="divide-y divide-slate-50 text-xs font-medium text-slate-600">
                <div className="grid grid-cols-4 py-1.5">
                  <div className="font-bold text-[#003366]">1 Unit</div>
                  <div>₹127</div>
                  <div className="text-emerald-600 font-semibold">₹102</div>
                  <div>₹25</div>
                </div>
                <div className="grid grid-cols-4 py-1.5">
                  <div className="font-bold text-[#003366]">5 Units</div>
                  <div>₹635</div>
                  <div className="text-emerald-600 font-semibold">₹510</div>
                  <div>₹125</div>
                </div>
                <div className="grid grid-cols-4 py-1.5">
                  <div className="font-bold text-[#003366]">10 Units</div>
                  <div>₹1,270</div>
                  <div className="text-emerald-600 font-semibold">₹1,020</div>
                  <div>₹250</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Hand: Payment Summary, Maturity, Actions, Plan Management (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* PAYMENT SUMMARY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" /> Payment & Collection Summary
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Today's Payment</span>
                <span className={`inline-flex items-center gap-1 font-bold text-sm mt-1 ${dueInfo.paidToday ? "text-emerald-600" : "text-amber-600"}`}>
                  {dueInfo.paidToday ? "Paid" : "Pending"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Yesterday's Payment</span>
                <span className={`inline-flex items-center gap-1 font-bold text-sm mt-1 ${paidYesterday ? "text-emerald-600" : "text-amber-600"}`}>
                  {paidYesterday ? "Paid" : "Pending"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Pending Days</span>
                <span className="font-bold text-sm text-slate-800 block mt-1">{dueInfo.dueDays} Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Due Amount</span>
                <span className="font-bold text-sm text-rose-600 block mt-1">₹{dueInfo.dueAmount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Fine Amount</span>
                <span className="font-bold text-sm text-rose-600 block mt-1">₹{dueInfo.fineAmount}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Last Payment Date</span>
                <span className="font-bold text-xs text-slate-700 block mt-1.5">{dueInfo.lastPaymentDate}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Last Receipt Number</span>
                <span className="font-mono text-[10px] text-slate-700 font-bold block mt-2 break-all">{lastReceiptNo}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Total Paid Days</span>
                <span className="font-bold text-sm text-emerald-600 block mt-1">{totalPaidDays} / 180 Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Remaining Days</span>
                <span className="font-bold text-sm text-slate-800 block mt-1">{remainingDays} Days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Total Collections</span>
                <span className="font-bold text-sm text-slate-800 block mt-1">₹{totalCollections}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Total Savings</span>
                <span className="font-bold text-sm text-emerald-600 block mt-1">₹{totalSavingsCalculated}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-bold uppercase text-[9px]">Total Company Collection</span>
                <span className="font-bold text-sm text-slate-700 block mt-1">₹{totalCompanyCollectionCalculated}</span>
              </div>
            </div>
          </div>

          {/* MATURITY SECTION (Read Only) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-emerald-50/20 to-teal-50/20">
            <h3 className="font-bold text-[#003366] text-base uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Maturity Outlook <span className="text-[10px] bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 font-bold uppercase ml-auto border border-emerald-200 shrink-0">Read Only</span>
            </h3>

            {/* Payment Progress */}
            <div className="mb-5">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <span>Payment Progress</span>
                <span className="text-[#003366]">{totalPaidDays} / 180 Days</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3.5 border border-slate-200 overflow-hidden">
                <div 
                  className="bg-[#003366] h-full rounded-full transition-all duration-500 relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>0% Saved</span>
                <span>{progressPercentage}% Saved</span>
                <span>100% Target</span>
              </div>
            </div>

            {/* Holdings & Expected Dates */}
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 uppercase tracking-wider">Holding / Waiting Period</span>
                <span className="text-slate-800 font-bold">3 Years</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 uppercase tracking-wider">Expected Maturity Date</span>
                <span className="text-emerald-700 font-bold text-sm">{maturityDateObj.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 uppercase tracking-wider">Maturity Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                  isMatured 
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}>
                  {maturityStatus}
                </span>
              </div>
            </div>

            {/* Total Maturity Value Card */}
            <div className="mt-5 p-4 bg-emerald-600 rounded-xl text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 bottom-0 text-white/5 font-black text-6xl select-none translate-x-3 translate-y-3">
                SAVE
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">Projected Maturity Payout</span>
              <span className="block font-black text-3xl mt-1">₹{Math.round(totalSavingsCalculated * 1.60).toLocaleString()}</span>
              
              <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-emerald-500/50 text-[11px] font-semibold text-emerald-100">
                <div>
                  <span className="block text-[9px] text-emerald-200 font-medium uppercase">Savings Base</span>
                  <span className="text-white font-bold">₹{totalSavingsCalculated.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-emerald-200 font-medium uppercase">60% Maturity Bonus</span>
                  <span className="text-white font-bold">₹{Math.round(totalSavingsCalculated * 0.60).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
              Account Actions
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => setShowCollectModal(true)}
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Coins className="w-4 h-4" /> Collect Payment
              </button>
              
              <button 
                onClick={() => {
                  setActiveTab("receipt");
                  const el = document.getElementById("profile-tabs-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full px-4 py-2.5 text-xs font-bold text-[#003366] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" /> View Receipts
              </button>

              <button 
                onClick={() => {
                  setActiveTab("reminder");
                  const el = document.getElementById("profile-tabs-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <History className="w-4 h-4" /> Reminder History
              </button>

              <button 
                onClick={handlePrintMemberCard}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Member Card
              </button>

              <button 
                onClick={handleDownloadMemberPDF}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Member PDF
              </button>

              <button 
                onClick={handleShareWhatsApp}
                className="w-full px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> Share WhatsApp Receipt
              </button>
            </div>
          </div>

          {/* PLAN MANAGEMENT SECTION (Admin Only) */}
          {isAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" /> Administrative Plan Management
              </h3>
              
              <div className="space-y-3">
                {/* Increase/Decrease Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleIncreaseUnits}
                    className="px-3 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Increase Plan Units
                  </button>
                  <button 
                    onClick={handleDecreaseUnits}
                    className="px-3 py-2 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-100 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" /> Decrease Plan Units
                  </button>
                </div>

                {/* Account State Toggles */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button 
                    onClick={handlePauseMembership}
                    className="px-2 py-2 text-[10px] font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-100 flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-4 h-4" /> Pause Account
                  </button>
                  <button 
                    onClick={handleResumeMembership}
                    className="px-2 py-2 text-[10px] font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-100 flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-4 h-4" /> Resume Account
                  </button>
                  <button 
                    onClick={handleCloseMembership}
                    className="px-2 py-2 text-[10px] font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-100 flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-4 h-4" /> Close Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* HISTORY & LOGS TAB SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="profile-tabs-section">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 overflow-x-auto whitespace-nowrap">
          <button 
            onClick={() => setActiveTab("payment")}
            className={`px-6 py-4 border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "payment" ? "border-[#003366] text-[#003366] bg-white" : "border-transparent hover:text-slate-800"}`}
          >
            <Coins className="w-4 h-4" /> Payment History
          </button>
          <button 
            onClick={() => setActiveTab("receipt")}
            className={`px-6 py-4 border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "receipt" ? "border-[#003366] text-[#003366] bg-white" : "border-transparent hover:text-slate-800"}`}
          >
            <FileText className="w-4 h-4" /> Receipt History
          </button>
          <button 
            onClick={() => setActiveTab("reminder")}
            className={`px-6 py-4 border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "reminder" ? "border-[#003366] text-[#003366] bg-white" : "border-transparent hover:text-slate-800"}`}
          >
            <History className="w-4 h-4" /> Reminder History
          </button>
          <button 
            onClick={() => setActiveTab("audit")}
            className={`px-6 py-4 border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === "audit" ? "border-[#003366] text-[#003366] bg-white" : "border-transparent hover:text-slate-800"}`}
          >
            <ClipboardList className="w-4 h-4" /> Audit Log
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === "payment" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Receipt No</th>
                    <th className="px-5 py-3">Deposit Amount</th>
                    <th className="px-5 py-3">Savings Portion</th>
                    <th className="px-5 py-3">Company Collection</th>
                    <th className="px-5 py-3">Maturity Bonus</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium bg-white">
                  {dailyCols.map(c => {
                    const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3.5">{new Date(c.timestamp).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">{c.receiptNo || c.id}</td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">₹{c.amount}</td>
                        <td className="px-5 py-3.5 text-emerald-600">₹{breakdown.savingsFund}</td>
                        <td className="px-5 py-3.5 text-slate-500">₹{breakdown.companyCommission}</td>
                        <td className="px-5 py-3.5 text-purple-600">₹{Math.round(breakdown.bonusFund)}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">{c.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            onClick={() => downloadReceiptPDFUtil(c, settings || {}, "download")} 
                            className="text-[#003366] hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded" 
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {dailyCols.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400">No payment deposits recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "receipt" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Receipt No</th>
                    <th className="px-5 py-3">Transaction Type</th>
                    <th className="px-5 py-3">Total Amount</th>
                    <th className="px-5 py-3">Collected By</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium bg-white">
                  {memberCols.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">{new Date(c.timestamp).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">{c.receiptNo || c.id}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{c.type}</td>
                      <td className="px-5 py-3.5 font-bold text-indigo-600">₹{c.amount}</td>
                      <td className="px-5 py-3.5 text-slate-400">{c.collectedByName || c.collectedBy || "System"}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">{c.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button 
                          onClick={() => downloadReceiptPDFUtil(c, settings || {}, "download")} 
                          className="text-[#003366] hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded" 
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {memberCols.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400">No transactions recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "reminder" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Date Sent</th>
                    <th className="px-5 py-3">Reminder ID</th>
                    <th className="px-5 py-3">Outstanding Dues</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium bg-white">
                  {filteredReminders.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">{new Date(r.reminderDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">{r.id}</td>
                      <td className="px-5 py-3.5 font-bold text-rose-600">₹{r.dueAmount}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">Sent Successfully</span>
                      </td>
                    </tr>
                  ))}
                  {filteredReminders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">No reminder messages sent to this account yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium bg-white">
                  {filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-700 uppercase tracking-wide text-[10px]">{log.action}</td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-pre-wrap">{log.details}</td>
                    </tr>
                  ))}
                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400">No audit trail entries for this member yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* COLLECT PAYMENT POPUP DIALOG */}
      {showCollectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Coins className="w-5 h-5 text-emerald-500" /> Collect Deposit</h3>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCollectPaymentSubmit} className="p-6 space-y-4 text-xs font-semibold text-slate-600">
              <div>
                <label className="text-slate-400 block font-bold uppercase tracking-wider mb-1.5">Number of Days</label>
                <input 
                  type="number" 
                  min={1} 
                  value={collectDays} 
                  onChange={(e) => setCollectDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block font-bold uppercase tracking-wider mb-1.5">Receipt Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave empty for auto-generation"
                  value={collectReceiptNo} 
                  onChange={(e) => setCollectReceiptNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                />
              </div>

              <div>
                <label className="text-slate-400 block font-bold uppercase tracking-wider mb-1.5">Transaction Notes (Optional)</label>
                <textarea 
                  placeholder="Enter details..."
                  value={collectNotes} 
                  onChange={(e) => setCollectNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
                  rows={2}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider">Plan Scale</span>
                  <span className="text-slate-800 font-bold">{totalActivePlans} Active Unit{totalActivePlans > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-wider">Unit Day Charge</span>
                  <span className="text-slate-800 font-bold">₹127 / Day</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-400 uppercase tracking-wider">Total Collection</span>
                  <span className="text-emerald-600 font-black text-base">₹{collectDays * (totalDailyAmount > 0 ? totalDailyAmount : 127)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Complete Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MEMBER CARD PREVIEW DIALOG */}
      {showPrintCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Printer className="w-5 h-5 text-indigo-500" /> Member Card Print Preview</h3>
              <button onClick={() => setShowPrintCard(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              {/* Printable Area Wrapper */}
              <div 
                id="printable-member-card"
                className="border-2 border-[#003366] rounded-2xl p-6 w-full max-w-[420px] bg-slate-50 relative overflow-hidden shadow-md"
              >
                {/* Visual Top Highlight Strip */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#003366]" />
                
                {/* Branding Block */}
                <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-base font-black text-[#003366] tracking-wider uppercase">SMART SAVE</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Authorized Member Card</span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">VERIFIED</span>
                  </div>
                </div>

                {/* Content Block */}
                <div className="flex gap-4">
                  {/* Photo Left */}
                  <div className="w-24 h-24 rounded-xl border border-slate-200 shadow-inner shrink-0 overflow-hidden bg-white flex items-center justify-center">
                    {(viewingMember as any).photo ? (
                      <img 
                        src={(viewingMember as any).photo} 
                        alt={viewingMember.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center">
                        <UserIcon className="w-8 h-8 text-slate-300 mx-auto" />
                        <span className="text-[7px] text-slate-400 font-extrabold uppercase mt-1 block">Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Bio Info Right */}
                  <div className="flex-1 text-xs font-semibold text-slate-600 space-y-2">
                    <div>
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block">Member ID</span>
                      <span className="font-mono text-sm text-slate-800 font-black">{viewingMember.id}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block">Full Name</span>
                      <span className="text-slate-800 font-extrabold">{viewingMember.name}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block">Mobile Number</span>
                      <span className="text-slate-800 font-bold">+91 {viewingMember.phone}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider block">Subscribed Units</span>
                      <span className="text-[#003366] font-black">{totalActivePlans} Unit(s) (₹{totalDailyAmount}/day)</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Details */}
                <div className="mt-5 pt-3 border-t border-slate-200 grid grid-cols-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider gap-y-1">
                  <div>Join Date: <span className="text-slate-700 font-extrabold">{regDate}</span></div>
                  <div className="text-right">Maturity: <span className="text-emerald-600 font-extrabold">{maturityDateObj.toLocaleDateString()}</span></div>
                </div>
              </div>

              <div className="flex justify-end gap-3 w-full mt-6">
                <button 
                  onClick={() => setShowPrintCard(false)}
                  className="px-4 py-2 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button 
                  onClick={triggerPrintWindow}
                  className="px-5 py-2 text-xs font-bold bg-[#003366] text-white rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Card Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
