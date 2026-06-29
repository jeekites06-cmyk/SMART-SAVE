import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { getMemberDueInfo, MemberDueInfo } from "../utils/reminder";
import { 
  Search, 
  Filter, 
  Send, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Users, 
  Wallet, 
  Calendar,
  Check,
  User,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Reminders() {
  const { members, collections, reminderHistory, addReminderHistoryItem } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Due Today" | "1 Day Due" | "2 Days Due" | "7+ Days Due">("All");
  const [activeTab, setActiveTab] = useState<"due-list" | "history">("due-list");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get current date string for calculations
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Compute reminder info for all members
  const memberDues = useMemo(() => {
    return members.map(m => getMemberDueInfo(m, collections, todayDateStr));
  }, [members, collections, todayDateStr]);

  // Dashboard Stats
  const stats = useMemo(() => {
    const totalDueMembers = memberDues.filter(m => m.dueDays > 0).length;
    
    // Today's Pending Members = Members who have NOT paid their expected daily deposit today
    const todayPendingMembers = memberDues.filter(m => !m.paidToday).length;
    
    // Today's Paid Members = Members who have paid their expected daily deposit today
    const todayPaidMembers = memberDues.filter(m => m.paidToday).length;

    // Today's Due Amount = sum of totalDailyAmount of all members who have NOT paid today
    const todayDueAmount = memberDues
      .filter(m => !m.paidToday)
      .reduce((sum, m) => sum + m.totalDailyAmount, 0);

    return {
      totalDueMembers,
      todayDueAmount,
      todayPaidMembers,
      todayPendingMembers
    };
  }, [memberDues]);

  // Filtered and searched due members
  const filteredDueMembers = useMemo(() => {
    return memberDues.filter(item => {
      const { member, dueDays, status, paidToday } = item;
      
      // 1. Search Query filter (Name, ID, Mobile Number)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = q === "" || 
        member.name.toLowerCase().includes(q) ||
        member.id.toLowerCase().includes(q) ||
        member.phone.includes(q);

      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter === "All") return true;
      if (statusFilter === "Paid") return dueDays === 0;
      if (statusFilter === "Due Today") return !paidToday;
      if (statusFilter === "1 Day Due") return dueDays === 1;
      if (statusFilter === "2 Days Due") return dueDays === 2;
      if (statusFilter === "7+ Days Due") return dueDays >= 7;

      return true;
    });
  }, [memberDues, searchQuery, statusFilter]);

  // Handle triggering a reminder
  const handleSendReminder = (item: MemberDueInfo) => {
    const reminderDate = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    
    addReminderHistoryItem({
      reminderDate,
      memberId: item.member.id,
      memberName: item.member.name,
      dueAmount: item.dueAmount,
      status: "Sent Successfully (In-App)"
    });

    setSuccessMessage(`Reminder successfully recorded for ${item.member.name} (ID: ${item.member.id})`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#E11D48] to-[#881337] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#E11D48]" /> Reminder Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Track daily member payment status, manage dues, and view log history.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveTab("due-list")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "due-list"
                ? "bg-white text-[#881337] shadow-lg"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Due List
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "history"
                ? "bg-white text-[#881337] shadow-lg"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Reminder History
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 shadow-lg text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Overview Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Due Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Due Members</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.totalDueMembers}</p>
          </div>
        </div>

        {/* Card 2: Today's Due Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Due Amount</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">₹{stats.todayDueAmount}</p>
          </div>
        </div>

        {/* Card 3: Today's Paid Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Paid Members</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.todayPaidMembers}</p>
          </div>
        </div>

        {/* Card 4: Today's Pending Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Pending Members</p>
            <p className="text-2xl font-extrabold text-slate-700 mt-1">{stats.todayPendingMembers}</p>
          </div>
        </div>
      </div>

      {activeTab === "due-list" ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
          {/* Filters and Search Bar */}
          <div className="p-5 border-b border-slate-150 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/50">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by Name, Member ID or Mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white bg-slate-50/50 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Status:
              </span>
              {(["All", "Paid", "Due Today", "1 Day Due", "2 Days Due", "7+ Days Due"] as const).map((filterName) => (
                <button
                  key={filterName}
                  onClick={() => setStatusFilter(filterName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === filterName
                      ? "bg-[#E11D48] text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {filterName}
                </button>
              ))}
            </div>
          </div>

          {/* Members Due Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Member ID</th>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4 text-center">Active Plans</th>
                  <th className="px-6 py-4 text-right font-mono">Daily Target</th>
                  <th className="px-6 py-4 text-center">Due Days</th>
                  <th className="px-6 py-4 text-right font-mono">Due Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Last Payment</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {filteredDueMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-500">No members match your criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms</p>
                    </td>
                  </tr>
                ) : (
                  filteredDueMembers.map((item) => {
                    const { member, totalActivePlans, totalDailyAmount, dueDays, dueAmount, status, lastPaymentDate } = item;
                    
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{member.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{member.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">+91 {member.phone}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                            {totalActivePlans}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800 font-mono">₹{totalDailyAmount}</td>
                        <td className="px-6 py-4 text-center font-bold font-mono">
                          {dueDays > 0 ? (
                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                              {dueDays}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold font-mono">
                          {dueAmount > 0 ? (
                            <span className="text-rose-600">₹{dueAmount}</span>
                          ) : (
                            <span className="text-emerald-600">₹0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                            status === "Paid" ? "bg-emerald-100 text-emerald-800" :
                            status === "Due Today" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {status === "Paid" && <Check className="w-3 h-3" />}
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                          {lastPaymentDate}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {dueAmount > 0 ? (
                            <button
                              onClick={() => handleSendReminder(item)}
                              className="px-3 py-1.5 bg-blue-50 text-[#E11D48] hover:bg-[#E11D48] hover:text-white transition-all rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer border border-blue-200"
                            >
                              <Send className="w-3 h-3" /> Record Reminder
                            </button>
                          ) : (
                            <span className="text-emerald-500 text-xs font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid Up
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredDueMembers.length} of {members.length} Members
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-[#E11D48]" /> Reminder Logs
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">
              {reminderHistory.length} Logged Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Reminder Date & Time</th>
                  <th className="px-6 py-4">Member ID</th>
                  <th className="px-6 py-4">Member Name</th>
                  <th className="px-6 py-4 text-right font-mono">Dues at Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                {reminderHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-500">No reminder logs saved yet</p>
                      <p className="text-xs text-slate-400 mt-1">Logged reminder events will appear here</p>
                    </td>
                  </tr>
                ) : (
                  reminderHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-semibold flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {log.reminderDate}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">{log.memberId}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{log.memberName}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-800 font-mono">₹{log.dueAmount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" /> {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
