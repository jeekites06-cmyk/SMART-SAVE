import React, { useState, useMemo } from "react";
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  ShieldAlert,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function ActivityLog() {
  const { user } = useAuth();
  const { auditLogs, clearAuditLogs, logAudit } = useData();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "All" | "Today" | "Yesterday" | "This Week" | "This Month" | "Custom"
  >("All");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleClearLogs = () => {
    clearAuditLogs();
    logAudit(
      "Clear Audit Logs",
      "Super Admin cleared all activity logs",
      "System",
    );
    setShowClearConfirm(false);
  };

  const filteredLogs = useMemo(() => {
    let result = auditLogs;

    // Filter by date
    if (dateFilter !== "All") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      result = result.filter((log) => {
        const logDate = new Date(log.timestamp);
        logDate.setHours(0, 0, 0, 0);

        if (dateFilter === "Today")
          return logDate.getTime() === today.getTime();
        if (dateFilter === "Yesterday")
          return logDate.getTime() === yesterday.getTime();
        if (dateFilter === "This Week") return logDate >= startOfWeek;
        if (dateFilter === "This Month") return logDate >= startOfMonth;
        if (dateFilter === "Custom" && customStartDate && customEndDate) {
          const s = new Date(customStartDate);
          const e = new Date(customEndDate);
          e.setHours(23, 59, 59, 999);
          return logDate >= s && logDate <= e;
        }
        return true;
      });
    }

    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          (log.username && log.username.toLowerCase().includes(q)) ||
          (log.role && log.role.toLowerCase().includes(q)) ||
          (log.action && log.action.toLowerCase().includes(q)) ||
          (log.module && log.module.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q)) ||
          new Date(log.timestamp).toLocaleDateString().includes(q),
      );
    }

    return result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [auditLogs, searchTerm, dateFilter, customStartDate, customEndDate]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const exportCSV = () => {
    const headers = [
      "Date",
      "Time",
      "Username",
      "Role",
      "Action",
      "Module",
      "Description",
      "Status",
      "IP Address",
      "Device",
    ];
    const rows = filteredLogs.map((log) => {
      const d = new Date(log.timestamp);
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        log.username || "System",
        log.role || "System",
        log.action,
        log.module || "System",
        log.details,
        log.status || "Success",
        log.ipAddress || "Unknown",
        log.device || "Unknown",
      ]
        .map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Activity_Log_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role !== "Super Admin") {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 mt-2">
          Only Super Admin can access the Activity Log.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            Activity Log
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Monitor all system activities and user actions.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Username, Module, Action, or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {dateFilter === "Custom" && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <span className="text-slate-400 font-medium">to</span>
              <div className="relative flex-1">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto print-section">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Date & Time</th>
                <th className="px-6 py-4 whitespace-nowrap">User</th>
                <th className="px-6 py-4 whitespace-nowrap">Module</th>
                <th className="px-6 py-4 whitespace-nowrap">Action</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 whitespace-nowrap">IP / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const d = new Date(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {d.toLocaleDateString()}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {d.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {log.username || "System"}
                        </div>
                        <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded mt-0.5">
                          {log.role || "System"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                          {log.module || "System"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">
                          {log.action}
                        </div>
                        <div className="text-xs mt-0.5">
                          <span
                            className={
                              log.status === "Failed"
                                ? "text-red-600"
                                : "text-emerald-600"
                            }
                          >
                            {log.status || "Success"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 min-w-[200px]">
                        {log.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                        <div>{log.ipAddress || "192.168.1.x"}</div>
                        <div>{log.device || "Browser"}</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium text-lg">
                      No activity logs found
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      Try adjusting your filters or search term.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {filteredLogs.length}
              </span>{" "}
              logs
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Clear Activity Log?
              </h3>
              <p className="text-slate-500">
                This action cannot be undone. All activity records will be
                permanently deleted from the system.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Yes, Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
