import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  Printer
} from "lucide-react";
import { useData } from "../context/DataContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { calculateFinancialSummary, calculateCollectionBreakdown } from "../utils/finance";
import { Collection } from "../types";

export default function Reports() {
  const { collections, members, settings, employees } = useData();
  const [searchParams] = useSearchParams();

  const [reportType, setReportType] = useState(() => {
    return searchParams.get("type") || "Daily Collection Report";
  });
  const [dateFilter, setDateFilter] = useState(() => {
    const typeParam = searchParams.get("type") || "Daily Collection Report";
    return searchParams.get("date") || (typeParam === "Daily Collection Report" ? "Today" : "All Time");
  });

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam) {
      setReportType(typeParam);
    }
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setDateFilter(dateParam);
    }
  }, [searchParams]);

  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    if (type === "Daily Collection Report") setDateFilter("Today");
    else if (type === "Weekly Report") setDateFilter("Last 7 Days");
    else if (type === "Monthly Report") setDateFilter("This Month");
    else if (type === "6 Months Report") setDateFilter("Last 6 Months");
    else if (type === "Yearly Report") setDateFilter("This Year");
    else if (type === "Member-wise Report") setDateFilter("All Time");
    else setDateFilter("All Time");
  };

  const todayString = new Date().toISOString().split("T")[0];
  
  const activeMemberIds = useMemo(() => new Set(members.map(m => m.id)), [members]);
  const validCollections = useMemo(() => {
    const filtered = collections.filter(c => activeMemberIds.has(c.memberId));
    const seenReg = new Set<string>();
    const deduped: Collection[] = [];
    for (const c of filtered) {
      if (c.type === "Registration Fee") {
        if (!seenReg.has(c.memberId)) {
          seenReg.add(c.memberId);
          deduped.push(c);
        }
      } else {
        deduped.push(c);
      }
    }
    return deduped;
  }, [collections, activeMemberIds]);

  const todayCols = validCollections.filter(c => c.timestamp.startsWith(todayString));
  const todayStats = calculateFinancialSummary(todayCols, members, settings);
  
  const todaysCollectionAmount = todayStats.todayCollection + todayStats.todayRegistrationRevenue;
  const todaysSavingsAmount = todayStats.totalSavings;
  const todaysCompanyRevenue = todayStats.todayRegistrationRevenue + todayStats.companyDailyProfit;
  const todaysBonus = todayStats.totalBonus;

  const totalStats = calculateFinancialSummary(collections, members, settings);
  
  // Total logic: the actual money collected
  const totalNonRegCollectionsAmount = useMemo(() => {
    return validCollections.filter(c => c.type !== "Registration Fee").reduce((acc, c) => acc + parseInt(c.amount || "0", 10), 0);
  }, [validCollections]);
  const totalCollectionAmount = totalNonRegCollectionsAmount + totalStats.registrationRevenue;
  const totalSavingsAmount = totalStats.totalSavings;
  const totalCompanyRevenueAmount = totalStats.totalCompanyRevenue;
  const totalBonusAmount = totalStats.totalBonus;

  const filterByDate = (dateStr: string) => {
    if (dateFilter === "All Time") return true;
    const d = new Date(dateStr);
    const now = new Date();
    
    if (dateFilter === "Today") {
      return dateStr.startsWith(todayString);
    }
    if (dateFilter === "Yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return dateStr.startsWith(y.toISOString().split("T")[0]);
    }
    if (dateFilter === "Last 7 Days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return d >= past;
    }
    if (dateFilter === "This Month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "Last Month") {
      let m = now.getMonth() - 1;
      let y = now.getFullYear();
      if (m < 0) { m = 11; y--; }
      return d.getMonth() === m && d.getFullYear() === y;
    }
    if (dateFilter === "Last 6 Months") {
      const past = new Date(now);
      past.setMonth(past.getMonth() - 6);
      return d >= past;
    }
    if (dateFilter === "This Year") {
      return d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "Custom Date Range") {
      if (!customStartDate || !customEndDate) return true;
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
    return true;
  };

  const displayData = useMemo(() => {
    let filteredCollections = validCollections.filter(c => filterByDate(c.timestamp));

    if (reportType === "Registration Report") {
      filteredCollections = filteredCollections.filter(c => c.type === "Registration Fee");
    } else if (reportType === "Bonus Fund Report") {
      filteredCollections = filteredCollections.filter(c => calculateCollectionBreakdown(parseInt(c.amount || "0", 10), c.type).bonusFund > 0);
    }

    if (searchQuery) {
      filteredCollections = filteredCollections.filter(c => 
        c.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.memberId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (reportType === "Pending Members Report") {
      let mList = members;
      if (searchQuery) {
        mList = mList.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return mList.filter(m => {
        const mCols = validCollections.filter(c => c.memberId === m.id && c.type === "Daily Deposit");
        if (mCols.length === 0) return true;
        const lastCol = mCols.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        return !lastCol.timestamp.startsWith(todayString);
      }).map(m => {
        const mCols = validCollections.filter(c => c.memberId === m.id);
        const mStats = calculateFinancialSummary(mCols);
        return {
          date: new Date().toLocaleDateString(),
          memberId: m.id,
          memberName: m.name,
          dailyDeposit: m.dailyAmount || 0,
          memberSavings: mStats.totalSavings,
          companyCollection: mStats.totalCompanyCommission,
          bonusFund: mStats.totalBonus,
          companyProfit: mStats.totalCompanyProfit,
          registrationFee: mStats.registrationRevenue,
          totalAmount: 0
        };
      });
    } else if (reportType === "Maturity Report") {
      let mList = members;
      if (searchQuery) {
        mList = mList.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.id.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return mList.map(m => {
        const mCols = validCollections.filter(c => c.memberId === m.id);
        const mStats = calculateFinancialSummary(mCols);
        return {
          date: new Date().toLocaleDateString(),
          memberId: m.id,
          memberName: m.name,
          dailyDeposit: m.dailyAmount || 0,
          memberSavings: mStats.totalSavings,
          companyCollection: mStats.totalCompanyCommission,
          bonusFund: mStats.totalBonus,
          companyProfit: mStats.totalCompanyProfit,
          registrationFee: mStats.registrationRevenue,
          totalAmount: mStats.totalSavings + mStats.totalBonus
        };
      });
    } else if (reportType === "Employee Performance Report") {
      let empList = employees || [];
      if (searchQuery) {
        empList = empList.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return empList.map(e => {
        const empCols = validCollections.filter(c => c.collectedBy === e.id);
        const totalCollected = empCols.reduce((sum, c) => sum + Number(c.amount || 0), 0);
        const regCount = members.filter(m => m.registeredBy === e.id).length;
        const commissionPct = Number(e.commissionPercentage || 0);
        const regComm = Number(e.registrationCommission || 0);
        const commissionEarned = empCols.reduce((sum, c) => sum + (Number(c.amount || 0) * commissionPct) / 100, 0) + (regCount * regComm);
        
        // Target achievement %
        const targetAmount = Number(e.dailyTarget || 1) * 30; // monthly target
        const targetAchievedPct = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;

        return {
          id: e.id,
          name: e.name,
          branch: e.branch,
          collectedAmount: totalCollected,
          registeredCount: regCount,
          commissionEarned: commissionEarned,
          salary: Number(e.monthlySalary || 0),
          targetAchievedPct: targetAchievedPct,
          status: e.status
        };
      });
    } else {
      return filteredCollections.map(c => {
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
    }
  }, [validCollections, members, reportType, dateFilter, customStartDate, customEndDate, searchQuery]);

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    
    // Smart Save Logo / Header
    let textX = 14;
    if (settings?.companyLogo) {
      try {
        doc.addImage(settings.companyLogo, "PNG", 14, 10, 22, 22);
        textX = 40;
      } catch (e) {
        // Ignored gracefully if invalid
      }
    }

    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.text(settings?.companyName || "SMART SAVE FINANCIAL SYSTEMS", textX, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(reportType, textX, 28);
    
    doc.setFontSize(10);
    doc.text(`Generated Date & Time: ${new Date().toLocaleString()}`, textX, 34);
    doc.text(`Prepared By: Admin`, textX, 40);

    if (reportType === "Employee Performance Report") {
      autoTable(doc, {
        startY: 50,
        head: [["ID", "Employee Name", "Branch", "Total Collections", "Members Registered", "Commission Earned", "Monthly Salary", "Target Achieved %", "Status"]],
        body: displayData.map((row: any) => [
          row.id,
          row.name,
          row.branch,
          `Rs ${row.collectedAmount.toLocaleString()}`,
          row.registeredCount,
          `Rs ${row.commissionEarned.toLocaleString()}`,
          `Rs ${row.salary.toLocaleString()}`,
          `${row.targetAchievedPct}%`,
          row.status
        ])
      });
      doc.save(`Employee_Performance_Report_${new Date().getTime()}.pdf`);
      return;
    }
    
    autoTable(doc, {
      startY: 45,
      head: [["Date", "Member ID", "Member Name", "Daily Deposit", "Savings", "Comp. Col.", "Bonus", "Profit", "Reg. Fee", "Total"]],
      body: [
        ...displayData.map(r => [
          r.date, r.memberId, r.memberName, `Rs ${r.dailyDeposit}`, `Rs ${r.memberSavings}`, `Rs ${r.companyCollection}`, `Rs ${r.bonusFund}`, `Rs ${r.companyProfit}`, `Rs ${r.registrationFee}`, `Rs ${r.totalAmount}`
        ]),
        // Totals
        [
          "", "", "TOTALS", 
          `Rs ${displayData.reduce((a, b) => a + Number(b.dailyDeposit), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.memberSavings), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.companyCollection), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.bonusFund), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.companyProfit), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.registrationFee), 0)}`,
          `Rs ${displayData.reduce((a, b) => a + Number(b.totalAmount), 0)}`
        ]
      ],
      didDrawPage: function (data) {
        let str = "Page " + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(10);
        let pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(str, data.settings.margin.left, pageHeight - 10);
      }
    });
    
    doc.save(`${reportType.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
    if (reportType === "Employee Performance Report") {
      const wsData = displayData.map((r: any) => ({
        "Employee ID": r.id,
        "Employee Name": r.name,
        "Branch": r.branch,
        "Total Collections": r.collectedAmount,
        "Members Registered": r.registeredCount,
        "Commission Earned": r.commissionEarned,
        "Monthly Salary": r.salary,
        "Target Achieved %": r.targetAchievedPct,
        "Status": r.status
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employee Performance");
      XLSX.writeFile(wb, `Employee_Performance_Report_${new Date().getTime()}.xlsx`);
      return;
    }

    const wsData = displayData.map(r => ({
      "Date": r.date,
      "Member ID": r.memberId,
      "Member Name": r.memberName,
      "Daily Deposit": r.dailyDeposit,
      "Member Savings": r.memberSavings,
      "Company Collection": r.companyCollection,
      "Bonus Fund": r.bonusFund,
      "Company Profit": r.companyProfit,
      "Registration Fee": r.registrationFee,
      "Total Amount": r.totalAmount
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${reportType.replace(/\s+/g, "_")}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:m-0 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#374151] to-[#111827]">Financial Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Generate and analyze financial data and member statistics.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Today's Collection</p>
           <p className="text-xl font-bold text-slate-800">₹{todaysCollectionAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Today's Savings</p>
           <p className="text-xl font-bold text-[#374151]">₹{todaysSavingsAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Today's Company Rev</p>
           <p className="text-xl font-bold text-slate-800">₹{todaysCompanyRevenue.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Today's Bonus</p>
           <p className="text-xl font-bold text-purple-600">₹{todaysBonus.toLocaleString()}</p>
         </div>
         
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg bg-slate-50">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Collection</p>
           <p className="text-xl font-bold text-slate-800">₹{totalCollectionAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg bg-gradient-to-r from-[#374151] to-[#111827]/5 border-[#003366]/20">
           <p className="text-xs text-[#374151]/70 font-medium uppercase tracking-wider mb-1">Total Savings</p>
           <p className="text-xl font-bold text-[#374151]">₹{totalSavingsAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg bg-slate-50">
           <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Company Rev</p>
           <p className="text-xl font-bold text-slate-800">₹{totalCompanyRevenueAmount.toLocaleString()}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg bg-purple-50 border-purple-200">
           <p className="text-xs text-purple-700 font-medium uppercase tracking-wider mb-1">Total Bonus</p>
           <p className="text-xl font-bold text-purple-700">₹{totalBonusAmount.toLocaleString()}</p>
         </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg space-y-4 print:hidden">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Report Type</label>
            <select 
              value={reportType} 
              onChange={e => handleReportTypeChange(e.target.value)} 
              className="border-slate-300 rounded-md shadow-lg focus:border-[#003366] focus:ring-[#003366] text-sm"
            >
              <option>Daily Collection Report</option>
              <option>Weekly Report</option>
              <option>Monthly Report</option>
              <option>6 Months Report</option>
              <option>Yearly Report</option>
              <option>Member-wise Report</option>
              <option>Registration Report</option>
              <option>Company Revenue Report</option>
              <option>Bonus Fund Report</option>
              <option>Pending Members Report</option>
              <option>Maturity Report</option>
              <option>Employee Performance Report</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Date Range</label>
            <select 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)} 
              className="border-slate-300 rounded-md shadow-lg focus:border-[#003366] focus:ring-[#003366] text-sm"
              disabled={reportType === "Pending Members Report" || reportType === "Maturity Report"}
            >
              <option>Today</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>All Time</option>
              <option>Custom Date Range</option>
            </select>
          </div>
          {dateFilter === "Custom Date Range" && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="border-slate-300 rounded-md shadow-lg focus:border-[#003366] focus:ring-[#003366] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="border-slate-300 rounded-md shadow-lg focus:border-[#003366] focus:ring-[#003366] text-sm" />
              </div>
            </>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {reportType === "Employee Performance Report" ? "Search Employee" : "Search Member"}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or ID..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-9 w-full border-slate-300 rounded-md shadow-lg focus:border-[#003366] focus:ring-[#003366] text-sm" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden print:shadow-none print:border-none">
        {/* Print Header that is only visible when printing */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#374151] to-[#111827]">{settings?.companyName || "SMART SAVE FINANCIAL SYSTEMS"}</h1>
          <h2 className="text-lg font-semibold text-slate-800">{reportType}</h2>
          <div className="text-sm text-slate-500 mt-2">
            <p>Generated Date & Time: {new Date().toLocaleString()}</p>
            <p>Prepared By: Admin</p>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden">
          <h2 className="font-bold text-slate-800">{reportType}</h2>
          <div className="flex gap-2">
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
              <Download className="w-4 h-4" /> Excel
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {reportType === "Employee Performance Report" ? (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100 print:bg-transparent print:border-black">
                 <tr>
                   <th className="px-4 py-3">Employee ID</th>
                   <th className="px-4 py-3">Employee Name</th>
                   <th className="px-4 py-3">Branch</th>
                   <th className="px-4 py-3 text-right">Total Collections</th>
                   <th className="px-4 py-3 text-right">Members Registered</th>
                   <th className="px-4 py-3 text-right">Commission Earned</th>
                   <th className="px-4 py-3 text-right">Monthly Salary</th>
                   <th className="px-4 py-3 text-right">Target Achieved %</th>
                   <th className="px-4 py-3 text-center">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                 {displayData.map((row: any, i) => (
                   <tr key={i} className="hover:bg-slate-50 print:hover:bg-transparent">
                     <td className="px-4 py-3 font-mono text-xs">{row.id}</td>
                     <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                     <td className="px-4 py-3 text-slate-500">{row.branch}</td>
                     <td className="px-4 py-3 text-right text-slate-800">₹{row.collectedAmount.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right text-slate-500">{row.registeredCount}</td>
                     <td className="px-4 py-3 text-right text-emerald-600 font-semibold">₹{row.commissionEarned.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right text-slate-800">₹{row.salary.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right">
                       <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                         row.targetAchievedPct >= 80 ? "bg-emerald-100 text-emerald-800" :
                         row.targetAchievedPct >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                       }`}>
                         {row.targetAchievedPct}%
                       </span>
                     </td>
                     <td className="px-4 py-3 text-center">
                       <span className={`px-2 py-0.5 rounded text-xs font-bold ${row.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                         {row.status}
                       </span>
                     </td>
                   </tr>
                 ))}
                 {displayData.length === 0 && (
                   <tr>
                     <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                       No employees found.
                     </td>
                   </tr>
                 )}
                 {displayData.length > 0 && (
                   <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-transparent print:border-t-black">
                     <td colSpan={3} className="px-4 py-3 text-right">TOTALS:</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row: any) => acc + row.collectedAmount, 0).toLocaleString()}</td>
                     <td className="px-4 py-3 text-right text-slate-500">{displayData.reduce((acc, row: any) => acc + row.registeredCount, 0)}</td>
                     <td className="px-4 py-3 text-right text-emerald-700">₹{displayData.reduce((acc, row: any) => acc + row.commissionEarned, 0).toLocaleString()}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row: any) => acc + row.salary, 0).toLocaleString()}</td>
                     <td colSpan={2} className="px-4 py-3"></td>
                   </tr>
                 )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100 print:bg-transparent print:border-black">
                 <tr>
                   <th className="px-4 py-3">Date</th>
                   <th className="px-4 py-3">Member ID</th>
                   <th className="px-4 py-3">Member Name</th>
                   <th className="px-4 py-3 text-right">Daily Deposit</th>
                   <th className="px-4 py-3 text-right">Member Savings</th>
                   <th className="px-4 py-3 text-right">Comp. Col.</th>
                   <th className="px-4 py-3 text-right">Bonus Fund</th>
                   <th className="px-4 py-3 text-right">Comp. Profit</th>
                   <th className="px-4 py-3 text-right">Reg. Fee</th>
                   <th className="px-4 py-3 text-right font-bold text-emerald-700">Total Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                 {displayData.map((row, i) => (
                   <tr key={i} className="hover:bg-slate-50 print:hover:bg-transparent">
                     <td className="px-4 py-3">{row.date}</td>
                     <td className="px-4 py-3 text-slate-500">{row.memberId}</td>
                     <td className="px-4 py-3 font-medium text-slate-800">{row.memberName}</td>
                     <td className="px-4 py-3 text-right">₹{row.dailyDeposit}</td>
                     <td className="px-4 py-3 text-right">₹{row.memberSavings}</td>
                     <td className="px-4 py-3 text-right">₹{row.companyCollection}</td>
                     <td className="px-4 py-3 text-right">₹{row.bonusFund}</td>
                     <td className="px-4 py-3 text-right">₹{row.companyProfit}</td>
                     <td className="px-4 py-3 text-right">₹{row.registrationFee}</td>
                     <td className="px-4 py-3 text-right font-bold text-emerald-600">₹{row.totalAmount}</td>
                   </tr>
                 ))}
                 {displayData.length === 0 && (
                   <tr>
                     <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                       No data found for the selected filters.
                     </td>
                   </tr>
                 )}
                 {displayData.length > 0 && (
                   <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 print:bg-transparent print:border-t-black">
                     <td colSpan={3} className="px-4 py-3 text-right">TOTALS:</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.dailyDeposit), 0)}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.memberSavings), 0)}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.companyCollection), 0)}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.bonusFund), 0)}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.companyProfit), 0)}</td>
                     <td className="px-4 py-3 text-right">₹{displayData.reduce((acc, row) => acc + Number(row.registrationFee), 0)}</td>
                     <td className="px-4 py-3 text-right text-emerald-700 text-base">₹{displayData.reduce((acc, row) => acc + Number(row.totalAmount), 0)}</td>
                   </tr>
                 )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

