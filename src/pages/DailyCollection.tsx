import React, { useState, useMemo, useEffect } from "react";
import { 
  IndianRupee, Search, User, CheckCircle2, History, MessageCircle, 
  FileText, Download, Printer, Plus, Edit2, Trash2, Calendar, 
  Filter, X, Lock, Unlock, AlertTriangle, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Member, Collection } from "../types";
import { useData } from "../context/DataContext";
import { calculateCollectionBreakdown } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp, downloadReceiptPDF } from "../utils/whatsapp";

export default function DailyCollection() {
  const { 
    members, 
    collections, 
    settings, 
    addCollection, 
    updateCollection, 
    deleteCollection, 
    updateMember, 
    financialSummary 
  } = useData();

  // Search & New Collection Input States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Daily Deposit");
  const [notes, setNotes] = useState("");
  const [notification, setNotification] = useState("");
  const [successCollection, setSuccessCollection] = useState<Collection | null>(null);

  // Business Day Manual Close State (for locking entries of today)
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [isBusinessDayClosed, setIsBusinessDayClosed] = useState(() => {
    const closed = localStorage.getItem(`smartsave_business_closed_${todayDateStr}`);
    return closed === "true";
  });

  // History & Filters State
  const [searchQueryHistory, setSearchQueryHistory] = useState("");
  const [filterDate, setFilterDate] = useState("All"); // "All", "Today", "Yesterday", "This Week", "This Month", "Custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "Completed", "Pending"
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals for Edit / Delete
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("Daily Deposit");
  const [editStatus, setEditStatus] = useState("Completed");
  const [editNotes, setEditNotes] = useState("");

  const [deletingCollection, setDeletingCollection] = useState<Collection | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleVerify = () => {
    if (!searchQuery) return;
    const query = searchQuery.trim().toLowerCase();
    const found = members.find(
      (m) =>
        m.id.toLowerCase() === query ||
        m.name.toLowerCase().includes(query) ||
        m.phone.includes(query)
    );
    if (found) {
      setSelectedMember(found);
      setAmount(settings?.defaultDailyAmount || found.dailyAmount || "127");
    } else {
      setSelectedMember(null);
      alert("Member not found.");
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setSelectedMember(null);
    setAmount("");
    setType("Daily Deposit");
    setNotes("");
    setSuccessCollection(null);
  };

  const handleCloseBusinessDay = () => {
    const confirmClose = window.confirm(
      "Are you sure you want to CLOSE the business day?\n\nThis will permanently lock all entries for today, preventing any edits or deletions. This action cannot be undone."
    );
    if (confirmClose) {
      localStorage.setItem(`smartsave_business_closed_${todayDateStr}`, "true");
      setIsBusinessDayClosed(true);
      showNotification("Today's business day has been closed. Today's entries are locked.");
    }
  };

  const handleConfirm = () => {
    if (!selectedMember) {
      alert("Please select a member first.");
      return;
    }
    const collectionAmount = Number(amount);
    if (!amount || isNaN(collectionAmount) || collectionAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // 6. Duplicate Payment Protection
    if (type === "Daily Deposit") {
      const alreadyCollected = collections.some(
        (c) =>
          c.memberId === selectedMember.id &&
          c.type === "Daily Deposit" &&
          c.timestamp.startsWith(todayDateStr)
      );
      if (alreadyCollected) {
        alert("Today's payment has already been collected for this member.");
        return;
      }
    }

    const { savingsFund } = calculateCollectionBreakdown(collectionAmount, type);

    const newCollection = addCollection({
      memberId: selectedMember.id,
      memberName: selectedMember.name,
      amount: amount,
      type: type,
      timestamp: new Date().toISOString(),
      status: "Completed",
      notes: notes,
    });

    const currentBalance = parseInt(
      (selectedMember.balance || "₹0").replace(/[^\d]/g, ""),
      10
    );
    const newBalance = currentBalance + savingsFund;

    updateMember(selectedMember.id, {
      balance: `₹${newBalance.toLocaleString()}`,
    });

    showNotification(
      `Successfully collected ₹${amount} from ${selectedMember.name}`
    );
    setSuccessCollection(newCollection);
  };

  // Helper to check if a collection is editable
  const isCollectionEditable = (col: Collection) => {
    const colDateStr = new Date(col.timestamp).toISOString().split("T")[0];
    if (colDateStr !== todayDateStr) {
      return false; // Past days are always locked
    }
    return !isBusinessDayClosed; // Today depends on whether business day is closed
  };

  // 1. Search & 2. Filters
  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      // Search Match
      const query = searchQueryHistory.trim().toLowerCase();
      if (query) {
        const member = members.find((m) => m.id === col.memberId);
        const phone = member?.phone || "";
        const matchesSearch =
          col.memberName.toLowerCase().includes(query) ||
          col.memberId.toLowerCase().includes(query) ||
          phone.includes(query) ||
          (col.receiptNo && col.receiptNo.toLowerCase().includes(query)) ||
          col.id.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }

      // Status Match
      if (filterStatus !== "All") {
        if (filterStatus === "Completed" && col.status !== "Completed") return false;
        if (filterStatus === "Pending" && col.status !== "Pending") return false;
      }

      // Date Range Match
      if (filterDate !== "All") {
        const colDate = new Date(col.timestamp);
        const today = new Date();
        
        if (filterDate === "Today") {
          if (colDate.toDateString() !== today.toDateString()) return false;
        } else if (filterDate === "Yesterday") {
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          if (colDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (filterDate === "This Week") {
          const startOfWeek = new Date();
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          if (colDate < startOfWeek) return false;
        } else if (filterDate === "This Month") {
          if (colDate.getMonth() !== today.getMonth() || colDate.getFullYear() !== today.getFullYear()) return false;
        } else if (filterDate === "Custom") {
          if (startDate) {
            const sDate = new Date(startDate);
            sDate.setHours(0, 0, 0, 0);
            if (colDate < sDate) return false;
          }
          if (endDate) {
            const eDate = new Date(endDate);
            eDate.setHours(23, 59, 59, 999);
            if (colDate > eDate) return false;
          }
        }
      }

      return true;
    });
  }, [collections, searchQueryHistory, filterDate, startDate, endDate, filterStatus, members]);

  // 3. Collection History Sorting (Latest first)
  const sortedFilteredCollections = useMemo(() => {
    const list = [...filteredCollections];
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [filteredCollections]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedFilteredCollections.length / itemsPerPage);
  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedFilteredCollections.slice(start, start + itemsPerPage);
  }, [sortedFilteredCollections, currentPage]);

  // Reset to page 1 if total pages changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Save Edit Action
  const handleOpenEdit = (col: Collection) => {
    if (!isCollectionEditable(col)) {
      alert("This collection cannot be edited. The business day is closed.");
      return;
    }
    setEditingCollection(col);
    setEditAmount(col.amount);
    setEditType(col.type);
    setEditStatus(col.status || "Completed");
    setEditNotes(col.notes || "");
  };

  const handleSaveEdit = () => {
    if (!editingCollection) return;
    const newAmt = Number(editAmount);
    if (!editAmount || isNaN(newAmt) || newAmt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // Update Member's balance according to the edited collection
    const currentMember = members.find((m) => m.id === editingCollection.memberId);
    if (currentMember) {
      const oldBreakdown = calculateCollectionBreakdown(parseInt(editingCollection.amount, 10), editingCollection.type);
      const newBreakdown = calculateCollectionBreakdown(newAmt, editType);
      const diffSavings = newBreakdown.savingsFund - oldBreakdown.savingsFund;

      const currentBalance = parseInt((currentMember.balance || "₹0").replace(/[^\d]/g, ""), 10);
      const newBalance = currentBalance + diffSavings;
      updateMember(currentMember.id, {
        balance: `₹${newBalance.toLocaleString()}`,
      });
    }

    updateCollection(editingCollection.id, {
      amount: editAmount,
      type: editType,
      status: editStatus,
      notes: editNotes,
    });

    setEditingCollection(null);
    showNotification("Collection updated successfully.");
  };

  // Delete Action
  const handleOpenDelete = (col: Collection) => {
    if (!isCollectionEditable(col)) {
      alert("This collection cannot be deleted. The business day is closed.");
      return;
    }
    setDeletingCollection(col);
  };

  const handleConfirmDelete = () => {
    if (!deletingCollection) return;

    // Subtract member's balance
    const currentMember = members.find((m) => m.id === deletingCollection.memberId);
    if (currentMember) {
      const breakdown = calculateCollectionBreakdown(parseInt(deletingCollection.amount, 10), deletingCollection.type);
      const currentBalance = parseInt((currentMember.balance || "₹0").replace(/[^\d]/g, ""), 10);
      const newBalance = Math.max(0, currentBalance - breakdown.savingsFund);
      updateMember(currentMember.id, {
        balance: `₹${newBalance.toLocaleString()}`,
      });
    }

    deleteCollection(deletingCollection.id);
    setDeletingCollection(null);
    showNotification("Collection deleted successfully.");
  };

  const todayTotal = financialSummary.todayCollection;

  const targetAmount =
    members
      .filter((m) => m.status === "Active")
      .reduce((sum, m) => sum + parseInt(m.dailyAmount || "0", 10), 0) || 1000;
  
  const targetPercentage = Math.min(
    100,
    Math.round((todayTotal / targetAmount) * 100)
  );

  const recentCollections = collections.slice(0, 5);

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Header with Business Day Close action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Collection</h1>
          <p className="text-slate-500 text-sm mt-1">
            Record new deposits and view real-time collection entries.
          </p>
        </div>
        
        {/* Business Day Status & Action */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${isBusinessDayClosed ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
            <span className={`w-2 h-2 rounded-full ${isBusinessDayClosed ? "bg-rose-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
            Business Day: {isBusinessDayClosed ? "Closed (Locked)" : "Open (Active)"}
          </div>
          {!isBusinessDayClosed && (
            <button
              onClick={handleCloseBusinessDay}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Close Business Day
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-2">
          {successCollection ? (
            <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden text-center p-10 animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
              <p className="text-slate-500 mb-6">
                Collected <span className="font-bold text-slate-800">₹{successCollection.amount}</span> from <span className="font-bold text-slate-800">{successCollection.memberName}</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    const member = members.find(m => m.id === successCollection.memberId);
                    if (member && member.phone) {
                      const msg = generateWhatsAppMessage(successCollection, settings);
                      openWhatsApp(member.phone, msg);
                    } else {
                      alert("Member phone number not found.");
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send WhatsApp Receipt
                </button>
                <button
                  onClick={() => downloadReceiptPDF(successCollection, settings, "download")}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => downloadReceiptPDF(successCollection, settings, "print")}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <button
                  onClick={handleClear}
                  className="text-[#003366] font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Enter Another Collection
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                  New Collection Entry
                </h2>
              </div>

              {isBusinessDayClosed ? (
                <div className="p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Today's Business Day is Closed</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm">
                    All new collections are disabled because the current business day has been locked. Please reopen the business day or wait until the next session.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Member Search */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Find Member
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                          className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                          placeholder="Search by Name, Phone or Member ID (e.g. MEM-001)"
                        />
                      </div>
                      <button
                        onClick={handleVerify}
                        className="px-6 bg-[#003366] hover:bg-[#004080] text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        Verify
                      </button>
                    </div>

                    {/* Member Found Card */}
                    {selectedMember && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-800 flex flex-shrink-0 items-center justify-center font-bold text-lg">
                          {selectedMember.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 text-base">
                            {selectedMember.name}{" "}
                            <span className="text-sm font-normal text-slate-500">
                              ({selectedMember.id})
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 mt-1">
                            Current Balance:{" "}
                            <span className="font-bold text-slate-800">
                              {selectedMember.balance || "₹0"}
                            </span>
                          </div>
                          <div
                            className={`text-xs mt-1.5 flex items-center gap-1 ${selectedMember.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                            {selectedMember.status} Member
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedMember(null)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Amount & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Collection Amount (₹)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg text-lg font-semibold focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Collection Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="block w-full px-3 py-3 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                      >
                        <option value="Daily Deposit">Daily Deposit</option>
                        <option value="Loan Repayment">Loan Repayment</option>
                        <option value="Penalty Fee">Penalty Fee</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Notes / Remarks (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                      placeholder="Add any specific details about this collection..."
                    ></textarea>
                  </div>
                </div>
              )}

              {!isBusinessDayClosed && (
                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                  <button
                    onClick={handleClear}
                    className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Clear Form
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedMember || !amount}
                    className="px-6 py-2.5 bg-[#003366] disabled:opacity-50 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-[#004080] transition-colors shadow-sm flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Collection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Summary / Recent */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-xl shadow-lg shadow-blue-200 border border-blue-900 p-6 text-white hover:shadow-xl transition-shadow">
            <h3 className="text-blue-200 text-sm font-medium mb-1">
              Today's Total Collection
            </h3>
            <div className="text-3xl font-bold flex items-center tracking-tight mb-4">
              <IndianRupee className="w-6 h-6 mr-1 opacity-80" />
              {todayTotal.toLocaleString()}
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${targetPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-200">
              {targetPercentage}% of daily target (₹
              {targetAmount.toLocaleString()})
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Recent Entries (Today)
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {recentCollections.length > 0 ? (
                recentCollections.map((col) => (
                  <div
                    key={col.id}
                    className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-sm">
                        {col.memberName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{col.memberId}</span>
                        <span>•</span>
                        <span>
                          {new Date(col.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600 text-sm flex items-center justify-end">
                        +₹{parseInt(col.amount, 10).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {col.type}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No recent entries.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collection History Panel (Full Width) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">Collection History</h2>
              <p className="text-xs text-slate-500">
                View, filter, edit, and print past transactions
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {sortedFilteredCollections.length} Records
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search Name, ID, Phone, Receipt..."
                value={searchQueryHistory}
                onChange={(e) => setSearchQueryHistory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366] bg-white transition-all"
              />
              {searchQueryHistory && (
                <button
                  onClick={() => setSearchQueryHistory("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date Filter selector */}
            <div className="relative">
              <select
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366] bg-white"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Date Range</option>
              </select>
            </div>

            {/* Status Filter selector */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#003366] bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed (Paid)</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Clear Filters indicator */}
            {(searchQueryHistory || filterDate !== "All" || filterStatus !== "All") && (
              <button
                onClick={() => {
                  setSearchQueryHistory("");
                  setFilterDate("All");
                  setFilterStatus("All");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className="text-[#003366] hover:text-blue-800 text-sm font-semibold flex items-center justify-center gap-1.5 py-2"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Custom Date Range inputs */}
          {filterDate === "Custom" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-slate-500">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#003366] bg-slate-50"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-slate-500">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#003366] bg-slate-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Collection History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-4">Receipt No</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Member Info</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Savings portion</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {paginatedCollections.length > 0 ? (
                paginatedCollections.map((col) => {
                  const breakdown = calculateCollectionBreakdown(parseInt(col.amount, 10), col.type);
                  const isEditable = isCollectionEditable(col);
                  
                  return (
                    <tr key={col.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {col.receiptNo || col.id}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(col.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        {new Date(col.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{col.memberName}</div>
                        <div className="text-xs text-slate-400">{col.memberId}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          {col.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        ₹{parseInt(col.amount, 10).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-emerald-600">
                        ₹{breakdown.savingsFund.toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${col.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {col.status || "Completed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Receipt and WhatsApp buttons */}
                          <button
                            onClick={() => {
                              const m = members.find(x => x.id === col.memberId);
                              if (m && m.phone) {
                                const msg = generateWhatsAppMessage(col, settings);
                                openWhatsApp(m.phone, msg);
                              } else {
                                alert("Phone number not found.");
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="WhatsApp Receipt"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => downloadReceiptPDF(col, settings, "download")}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => downloadReceiptPDF(col, settings, "print")}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit / Delete actions with visual lock fallback */}
                          {isEditable ? (
                            <>
                              <button
                                onClick={() => handleOpenEdit(col)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Collection"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(col)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Collection"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="p-1.5 text-slate-300 cursor-not-allowed" title="Day Closed: Entry Locked">
                              <Lock className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No transaction entries found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-500 text-center sm:text-left">
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, sortedFilteredCollections.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-700">{sortedFilteredCollections.length}</span> entries
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${currentPage === page ? "bg-[#003366] text-white border-transparent" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Collection Modal */}
      {editingCollection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#003366]" />
                Edit Collection Entry
              </h3>
              <button
                onClick={() => setEditingCollection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Member Name</span>
                  <span className="text-slate-800 block text-sm font-bold mt-0.5">{editingCollection.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Member ID</span>
                  <span className="text-slate-800 block text-sm font-bold mt-0.5">{editingCollection.memberId}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block uppercase font-semibold">Receipt Number</span>
                  <span className="text-slate-800 block font-mono font-bold mt-0.5">{editingCollection.receiptNo || editingCollection.id}</span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block uppercase font-semibold">Original Amount</span>
                  <span className="text-slate-800 block font-bold text-sm text-slate-600 mt-0.5">₹{editingCollection.amount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Collection Amount (₹)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Collection Type
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                  >
                    <option value="Daily Deposit">Daily Deposit</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                    <option value="Penalty Fee">Penalty Fee</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                  >
                    <option value="Completed">Completed (Paid)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                  Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#003366] focus:border-[#003366] bg-slate-50"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] rounded-lg transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Collection Modal */}
      {deletingCollection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 text-rose-600 mb-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Collection</h3>
                  <p className="text-xs text-slate-500 font-medium">Permanently remove this entry.</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete this collection? This action will permanently restore the member's balance and cannot be undone.
                </p>
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Member:</span>
                    <span className="font-bold text-slate-800">{deletingCollection.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <span className="font-bold text-rose-600">₹{deletingCollection.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Receipt No:</span>
                    <span className="font-mono text-slate-700 font-bold">{deletingCollection.receiptNo || deletingCollection.id}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingCollection(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
