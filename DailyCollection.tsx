import React, { useState } from "react";
import { IndianRupee, Search, User, CheckCircle2, History, MessageCircle, FileText, Download, Printer, Plus } from "lucide-react";
import { Member, Collection } from "../types";
import { useData } from "../context/DataContext";
import jsPDF from "jspdf";

import { calculateCollectionBreakdown } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp } from "../utils/whatsapp";

export default function DailyCollection() {
  const { members, collections, settings, addCollection, updateMember, financialSummary } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Daily Deposit");
  const [notes, setNotes] = useState("");
  const [notification, setNotification] = useState("");
  const [successCollection, setSuccessCollection] = useState<Collection | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleVerify = () => {
    if (!searchQuery) return;
    const query = searchQuery.toLowerCase();
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

    const { savingsFund, companyCommission, bonusFund, companyProfit } = calculateCollectionBreakdown(collectionAmount, type);

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

  const today = new Date().toISOString().split("T")[0];
  const todayCollections = collections.filter((c) =>
    c.timestamp.startsWith(today),
  );

  const { todayCollection: todayTotal } = financialSummary;

  const targetAmount =
    members
      .filter((m) => m.status === "Active")
      .reduce((sum, m) => sum + parseInt(m.dailyAmount || "0", 10), 0) || 1000;
  const targetPercentage = Math.min(
    100,
    Math.round((todayTotal / targetAmount) * 100),
  );

  const recentCollections = collections.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {notification && (
        <div className="fixed top-20 right-8 z-50 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Daily Collection</h1>
        <p className="text-slate-500 text-sm mt-1">
          Record new daily deposits from members.
        </p>
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
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send WhatsApp Receipt
                </button>
                <button
                  onClick={() => {
                    // Logic for PDF download
                    // Can be reused from Receipts, or we just alert
                    alert("Please use the Receipts page to download/print PDF for now.");
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
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
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-blue-600" />
                  New Collection Entry
                </h2>
              </div>

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

                  {/* Simulated Member Found Card */}
                  {selectedMember && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-800 flex flex-shrink-0 items-center justify-center font-bold text-lg">
                        {selectedMember.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
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
                className="bg-blue-400 h-2 rounded-full"
                style={{ width: `${targetPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-200">
              {targetPercentage}% of daily target (₹
              {targetAmount.toLocaleString()})
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">
                Recent Entries
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
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(col.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-emerald-600 text-sm flex items-center justify-end">
                        +₹{parseInt(col.amount, 10).toLocaleString()}
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
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
              <button className="text-sm text-blue-600 font-medium hover:text-blue-800">
                View All Today's Collections
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
