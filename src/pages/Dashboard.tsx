import React, { useState } from "react";
import {
  Users,
  IndianRupee,
  PiggyBank,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ReceiptText,
  X
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { calculateCollectionBreakdown } from "../utils/finance";
import { getMemberDueInfo } from "../utils/reminder";

export default function Dashboard() {
  const { members, collections, financialSummary, settings, commissionPayments, employees } = useData();
  const { user } = useAuth();

  const {
    totalSavings,
    totalBonus,
    totalCompanyProfit,
    registrationRevenue,
    todayRegistrationRevenue,
    todayRegistrationsCount,
    todayCollection,
    todayTransactionsCount,
    companyDailyProfit,
    totalCompanyRevenue
  } = financialSummary;

  const pendingMembers = members.filter((m) => m.status === "Inactive").length;

  const [showTodayActions, setShowTodayActions] = useState(false);

  // --- COMMISSION CALCULATIONS ---
  const todayStr = new Date().toISOString().split("T")[0];

  const todayCollections = collections.filter((c) => c.timestamp.startsWith(todayStr));

  const handleGenerateDailyReport = () => {
    if (todayCollections.length === 0) {
      alert("No collections found today.");
      return;
    }

    const doc = new jsPDF("landscape");

    // Company Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text(settings?.companyName || "SMART SAVE FINANCIAL SYSTEMS", 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text("Daily Collection Report - Today", 14, 28);

    doc.setFontSize(10);
    doc.text(`Generated Date & Time: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(`Prepared By: Admin`, 14, 40);

    const reportRows = todayCollections.map((c) => {
      const breakdown = calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type);
      return {
        date: new Date(c.timestamp).toLocaleDateString(),
        memberId: c.memberId,
        memberName: c.memberName,
        dailyDeposit: c.type === "Daily Deposit" ? parseInt(c.amount || "0", 10) : 0,
        memberSavings: breakdown.savingsFund,
        companyCollection: breakdown.companyCommission,
        bonusFund: breakdown.bonusFund,
        companyProfit: breakdown.companyProfit,
        registrationFee: c.type === "Registration Fee" ? parseInt(c.amount || "0", 10) : 0,
        totalAmount: parseInt(c.amount || "0", 10)
      };
    });

    autoTable(doc, {
      startY: 45,
      head: [["Date", "Member ID", "Member Name", "Daily Deposit", "Savings", "Comp. Col.", "Bonus", "Profit", "Reg. Fee", "Total"]],
      body: [
        ...reportRows.map(r => [
          r.date, r.memberId, r.memberName, `Rs ${r.dailyDeposit}`, `Rs ${r.memberSavings}`, `Rs ${r.companyCollection}`, `Rs ${r.bonusFund}`, `Rs ${r.companyProfit}`, `Rs ${r.registrationFee}`, `Rs ${r.totalAmount}`
        ]),
        // Totals
        [
          "", "", "TOTALS", 
          `Rs ${reportRows.reduce((a, b) => a + Number(b.dailyDeposit), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.memberSavings), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.companyCollection), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.bonusFund), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.companyProfit), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.registrationFee), 0)}`,
          `Rs ${reportRows.reduce((a, b) => a + Number(b.totalAmount), 0)}`
        ]
      ],
      didDrawPage: function (data) {
        let str = "Page " + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(10);
        let pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });

    doc.save(`Daily_Collection_Report_Today_${new Date().getTime()}.pdf`);
  };

  const handleViewAllActions = () => {
    if (todayCollections.length === 0) {
      alert("No collections found today.");
      return;
    }
    setShowTodayActions(true);
  };
  const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"

  const isEmployeeUser = user?.role === "Employee";
  const targetEmployeeId = isEmployeeUser ? user.memberId : null;

  const getCollectionCommission = (col: any) => {
    if (col.type === "Registration Fee" || !col.collectedBy || col.collectedBy === "admin") {
      return 0;
    }
    if (targetEmployeeId && col.collectedBy !== targetEmployeeId) {
      return 0;
    }
    return Number(settings?.employeeCommissionPerCollection || 5);
  };

  const getRegistrationCommissionForMember = (m: any) => {
    if (!m.registeredBy || m.registeredBy === "admin") return 0;
    if (targetEmployeeId && m.registeredBy !== targetEmployeeId) return 0;
    
    const emp = employees?.find((e) => e.id === m.registeredBy);
    return Number(emp?.registrationCommission || 0);
  };

  const todayEarnedCommission = 
    collections
      .filter((c) => c.timestamp.startsWith(todayStr))
      .reduce((sum, c) => sum + getCollectionCommission(c), 0) +
    members
      .filter((m) => m.joinDate === todayStr)
      .reduce((sum, m) => sum + getRegistrationCommissionForMember(m), 0);

  const monthlyEarnedCommission = 
    collections
      .filter((c) => c.timestamp.startsWith(currentMonthStr))
      .reduce((sum, c) => sum + getCollectionCommission(c), 0) +
    members
      .filter((m) => m.joinDate && m.joinDate.startsWith(currentMonthStr))
      .reduce((sum, m) => sum + getRegistrationCommissionForMember(m), 0);

  const totalEarnedCommission = 
    collections.reduce((sum, c) => sum + getCollectionCommission(c), 0) +
    members.reduce((sum, m) => sum + getRegistrationCommissionForMember(m), 0);

  const relevantPayments = (commissionPayments || []).filter(
    (p) => !targetEmployeeId || p.employeeId === targetEmployeeId
  );

  const totalCommissionPaid = relevantPayments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingCommission = totalEarnedCommission - totalCommissionPaid;

  // Calculate monthly trend (last 6 months)
  const last6Months = [...Array(6)]
    .map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleDateString("en-US", { month: "short" }),
      };
    })
    .reverse();

  const chartData = last6Months.map(({ month, year, label }) => {
    const monthCols = collections.filter((c) => {
      const d = new Date(c.timestamp);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const total = monthCols.reduce(
      (sum, col) => sum + parseInt(col.amount || "0", 10),
      0,
    );
    return { label, total };
  });

  const maxChartValue = Math.max(...chartData.map((d) => d.total), 1);

  // Multiple plans stats
  const totalActivePlans = members.reduce((sum, m) => {
    const plans = m.plans || [
      {
        id: `${m.id}-PLAN-1`,
        dailyAmount: parseInt(m.dailyAmount || "127", 10),
        status: m.status === "Active" ? "Active" : "Closed",
        startDate: m.joinDate
      }
    ];
    return sum + plans.filter((p) => p.status === "Active").length;
  }, 0);

  const memberTotalDailyAmount = members.reduce((sum, m) => {
    const plans = m.plans || [
      {
        id: `${m.id}-PLAN-1`,
        dailyAmount: parseInt(m.dailyAmount || "127", 10),
        status: m.status === "Active" ? "Active" : "Closed",
        startDate: m.joinDate
      }
    ];
    return sum + plans.filter((p) => p.status === "Active").reduce((s, p) => s + p.dailyAmount, 0);
  }, 0);

  // Calculate Reminder statistics dynamically
  const todayDateStr = new Date().toISOString().split("T")[0];
  const memberDues = members.map(m => getMemberDueInfo(m, collections, todayDateStr));
  const totalDueMembers = memberDues.filter(m => m.dueDays > 0).length;
  const todayPendingMembers = memberDues.filter(m => !m.paidToday).length;
  const todayPaidMembers = memberDues.filter(m => m.paidToday).length;
  const todayDueAmount = memberDues
    .filter(m => !m.paidToday)
    .reduce((sum, m) => sum + m.totalDailyAmount, 0);

  const stats = [
    {
      name: "Total Due Members",
      value: totalDueMembers.toString(),
      change: "",
      subtext: "Members with overdue accounts",
      subtextClass: "text-rose-600 font-bold",
      highlight: "border-l-4 border-l-rose-500 bg-rose-50/20",
      path: "/reminders",
    },
    {
      name: "Today's Due Amount",
      value: `₹${todayDueAmount.toLocaleString()}`,
      change: "",
      subtext: "Amount pending collection",
      subtextClass: "text-amber-600 font-bold",
      highlight: "border-l-4 border-l-amber-500 bg-amber-50/20",
      path: "/reminders",
    },
    {
      name: "Today's Paid Members",
      value: todayPaidMembers.toString(),
      change: "",
      subtext: "Members who paid today",
      subtextClass: "text-emerald-600 font-bold",
      highlight: "border-l-4 border-l-emerald-500 bg-emerald-50/20",
      path: "/reminders",
    },
    {
      name: "Today's Pending Members",
      value: todayPendingMembers.toString(),
      change: "",
      subtext: "Pending daily collection",
      subtextClass: "text-slate-500 font-bold",
      highlight: "border-l-4 border-l-slate-400 bg-slate-50/20",
      path: "/reminders",
    },
    {
      name: "Today's Reg Revenue",
      value: `₹${todayRegistrationRevenue.toLocaleString()}`,
      change: "",
      subtext: `From new registrations`,
      subtextClass: "text-purple-600 font-medium",
      highlight: "",
      path: "/members",
    },
    {
      name: "Total Reg Revenue",
      value: `₹${registrationRevenue.toLocaleString()}`,
      change: "",
      subtext: "From all members",
      subtextClass: "text-purple-600 font-medium",
      highlight: "",
      path: "/reports?type=Registration Report&date=All Time",
    },
    {
      name: "Total Registrations Today",
      value: todayRegistrationsCount.toString(),
      change: "",
      subtext: "New members joined",
      subtextClass: "text-purple-600 font-medium",
      highlight: "",
      path: "/members?registered=today",
    },
    {
      name: "Total Members",
      value: members.length.toString(),
      change: "",
      changeType: "positive",
      subtext: "",
      highlight: "",
      path: "/members",
    },
    {
      name: "Total Active Plans",
      value: totalActivePlans.toString(),
      change: "",
      subtext: "Across all members",
      subtextClass: "text-emerald-600 font-semibold",
      highlight: "border-l-4 border-l-emerald-400",
      path: "/members",
    },
    {
      name: "Member Total Daily Amount",
      value: `₹${memberTotalDailyAmount.toLocaleString()}`,
      change: "",
      subtext: "Daily target collection",
      subtextClass: "text-[#003366] font-semibold",
      highlight: "border-l-4 border-l-blue-400",
      path: "/members",
    },
    {
      name: "Today's Collection",
      value: `₹${todayCollection.toLocaleString()}`,
      change: "",
      subtext: `Today's total`,
      subtextClass: "text-[#2563EB] font-medium",
      highlight: "",
      path: "/daily-collection",
    },
    {
      name: "Total Member Savings",
      value: `₹${totalSavings.toLocaleString()}`,
      change: "",
      subtext: "Assets under management",
      subtextClass: "text-emerald-600",
      highlight: "",
      path: "/members",
    },
    {
      name: "Bonus Fund",
      value: `₹${totalBonus.toLocaleString()}`,
      change: "",
      subtext: "Total distributed",
      subtextClass: "text-orange-600",
      highlight: "",
      path: "/commissions",
    },
    {
      name: "Company Daily Profit",
      value: `₹${companyDailyProfit.toLocaleString()}`,
      change: "",
      subtext: "Profit today",
      subtextClass: "text-indigo-600",
      highlight: "",
      path: "/reports?type=Company Revenue Report&date=Today",
    },
    {
      name: "Total Company Revenue",
      value: `₹${totalCompanyRevenue.toLocaleString()}`,
      valueClass: "text-[#1e40af]",
      change: "",
      subtext: "Reg + Profit",
      subtextClass: "text-emerald-600",
      highlight: "",
      path: "/reports?type=Company Revenue Report&date=All Time",
    },
    {
      name: "Pending Members",
      value: pendingMembers.toString(),
      change: "",
      subtext: "Requires verification",
      subtextClass: "text-amber-600 font-semibold",
      highlight: "border-l-4 border-l-amber-400",
      path: "/members?status=Inactive",
    },
    {
      name: isEmployeeUser ? "My Today's Commission" : "Today's Employee Commission",
      value: `₹${todayEarnedCommission.toLocaleString()}`,
      change: "",
      subtext: "Earned today",
      subtextClass: "text-emerald-600 font-medium",
      highlight: "border-l-4 border-l-emerald-400",
      path: "/commissions",
    },
    {
      name: isEmployeeUser ? "My Monthly Commission" : "Monthly Employee Commission",
      value: `₹${monthlyEarnedCommission.toLocaleString()}`,
      change: "",
      subtext: "Earned this month",
      subtextClass: "text-emerald-600 font-medium",
      highlight: "border-l-4 border-l-emerald-400",
      path: "/commissions",
    },
    {
      name: isEmployeeUser ? "My Total Paid Commission" : "Total Commission Paid",
      value: `₹${totalCommissionPaid.toLocaleString()}`,
      change: "",
      subtext: "Paid commission",
      subtextClass: "text-[#2563EB] font-medium",
      highlight: "border-l-4 border-l-blue-400",
      path: "/commissions",
    },
    {
      name: isEmployeeUser ? "My Pending Commission" : "Pending Commission",
      value: `₹${pendingCommission.toLocaleString()}`,
      change: "",
      subtext: "Awaiting payment",
      subtextClass: "text-amber-600 font-semibold",
      highlight: "border-l-4 border-l-amber-400",
      path: "/commissions",
    },
  ];

  const recentTransactions = collections.slice(0, 5);
  const recentMembers = members.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#2563EB] to-[#1e40af]">
            Dashboard Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleGenerateDailyReport}
            className="bg-white border border-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-lg"
          >
            Download Report
          </button>
          <button className="bg-gradient-to-r from-[#2563EB] to-[#1e40af] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-[#1d4ed8] hover:to-[#1e3a8a] transition-colors shadow-lg flex items-center gap-2">
            <IndianRupee className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          return (
            <Link
              key={stat.name}
              to={stat.path}
              className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-lg hover:shadow-md transition-shadow cursor-pointer block ${stat.highlight || ""}`}
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {stat.name}
              </p>
              <p
                className={`text-2xl font-bold ${stat.valueClass || "text-slate-900"}`}
              >
                {stat.value}
              </p>

              {stat.change && (
                <div
                  className={`mt-2 text-xs flex items-center ${stat.changeType === "positive" ? "text-emerald-600" : "text-red-600"}`}
                >
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              )}

              {stat.subtext && (
                <div className={`mt-2 text-xs ${stat.subtextClass}`}>
                  {stat.subtext}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Charts & Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Collection Trend */}
        <Link
          to="/reports?type=Monthly Report"
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-lg hover:shadow-md transition-shadow block cursor-pointer"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">
              Monthly Collection Trend
            </h3>
            <select
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => e.stopPropagation()}
              className="text-xs border-slate-100 rounded px-2 py-1 outline-none text-slate-600 bg-slate-50 cursor-default"
            >
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-48 flex items-end justify-between px-4">
            {chartData.map((data, i) => (
              <div
                key={i}
                className={`w-12 sm:w-16 rounded-t-lg relative group transition-colors ${i === chartData.length - 1 ? "bg-[#2563EB]" : i === chartData.length - 2 ? "bg-blue-400" : "bg-slate-100 hover:bg-blue-200"}`}
                style={{
                  height: `${(data.total / maxChartValue) * 100}%`,
                  minHeight: data.total > 0 ? "10px" : "0",
                }}
              >
                <span
                  className={`absolute -top-6 left-0 right-0 text-center text-[10px] hidden group-hover:block ${i === chartData.length - 1 ? "font-bold text-[#1e40af]" : i === chartData.length - 2 ? "text-[#2563EB]" : ""}`}
                >
                  ₹
                  {data.total >= 1000
                    ? `${(data.total / 1000).toFixed(1)}k`
                    : data.total}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-4 mt-2 text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
            {chartData.map((data, i) => (
              <span key={i}>{data.label}</span>
            ))}
          </div>
        </Link>

         {/* Recent Members */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg flex flex-col hover:shadow-md transition-shadow">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Members</h3>
            <Link to="/members" className="text-xs text-[#2563EB] font-semibold hover:text-blue-800">
              View All
            </Link>
          </div>
          <div className="p-2 divide-y divide-slate-50 flex-grow">
            {recentMembers.length > 0 ? (
              recentMembers.map((member, i) => (
                <Link
                  key={i}
                  to={`/members?id=${member.id}`}
                  className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-[#2563EB] mr-3 font-bold shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0 pr-2">
                    <p className="text-sm font-semibold truncate text-slate-800">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {member.id} •{" "}
                      {new Date(member.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-[10px] font-bold uppercase ${member.status === "Active" ? "text-emerald-500" : "text-amber-500"}`}
                    >
                      {member.status}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                No recent members.
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">
            <p className="text-[10px] text-center text-slate-400">
              Updates automatically on new registrations
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-md transition-shadow border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            Recent Collections
          </h2>
          <button className="text-sm font-medium text-[#003366] hover:text-blue-800">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-3">Transaction ID</th>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {txn.id}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {txn.memberName}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ₹{parseInt(txn.amount, 10).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{txn.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          txn.status === "Completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No recent transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions / Bottom Bar */}
      <div className="bg-gradient-to-r from-[#2563EB] to-[#1e40af] rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg shadow-blue-200 gap-4">
        <div>
          <h4 className="text-lg font-bold">
            Ready to process today's collections?
          </h4>
          <p className="text-blue-100 text-sm opacity-80">
            You have {todayTransactionsCount} member transactions today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button 
            onClick={handleGenerateDailyReport}
            className="px-6 py-2 bg-white text-[#1e40af] font-bold rounded-lg shadow-lg hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
          >
            Generate Daily Report
          </button>
          <button 
            onClick={handleViewAllActions}
            className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg border border-blue-400 hover:bg-[#2563EB] transition-colors whitespace-nowrap text-sm"
          >
            View All Actions
          </button>
        </div>
      </div>

      {showTodayActions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Today's Collection Activities
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {todayCollections.length} activities for today ({new Date().toLocaleDateString()})
                </p>
              </div>
              <button
                onClick={() => setShowTodayActions(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table / List */}
            <div className="flex-grow overflow-y-auto p-6">
              {todayCollections.length > 0 ? (
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3">Transaction ID / Receipt</th>
                          <th className="px-6 py-3">Member</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Collected By</th>
                          <th className="px-6 py-3">Time</th>
                          <th className="px-6 py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {todayCollections.map((col) => (
                          <tr key={col.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">
                              <div>{col.id}</div>
                              {col.receiptNo && (
                                <div className="text-[10px] text-slate-400">
                                  Receipt: {col.receiptNo}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800">{col.memberName}</div>
                              <div className="text-[11px] text-slate-400">{col.memberId}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-950">
                              ₹{parseInt(col.amount, 10).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {col.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {col.collectedByName || col.collectedBy || "Admin"}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              {new Date(col.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate">
                              {col.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  No collections found today.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button
                onClick={handleGenerateDailyReport}
                className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white text-sm font-semibold rounded-lg shadow-lg transition-colors"
              >
                Download PDF Report
              </button>
              <button
                onClick={() => setShowTodayActions(false)}
                className="px-4 py-2 bg-white border border-slate-100 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
