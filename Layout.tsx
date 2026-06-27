import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ReceiptText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  User as UserIcon,
  X,
  Download,
  UserCheck,
  Coins,
} from "lucide-react";
import { User } from "../types";
import { useData } from "../context/DataContext";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

export default function Layout({ children, onLogout, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { backupData } = useData();
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    const lastBackup = localStorage.getItem("smartsave_last_backup");
    const today = new Date().getTime();
    if (!lastBackup) {
      setShowBackupReminder(true);
    } else {
      const daysSinceBackup = (today - parseInt(lastBackup, 10)) / (1000 * 3600 * 24);
      if (daysSinceBackup > 7) {
        setShowBackupReminder(true);
      }
    }
  }, []);

  const handleBackup = () => {
    backupData();
    localStorage.setItem("smartsave_last_backup", new Date().getTime().toString());
    setShowBackupReminder(false);
  };

  const dismissReminder = () => {
    localStorage.setItem("smartsave_last_backup", new Date().getTime().toString());
    setShowBackupReminder(false);
  };

  const getNavigation = () => {
    const baseNav = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ];
    
    if (user.role === "Super Admin" || user.role === "Administrator") {
      return [
        ...baseNav,
        { name: "Members", path: "/members", icon: Users },
        { name: "Employee Management", path: "/employee-management", icon: UserCheck },
        { name: "Daily Collection", path: "/daily-collection", icon: Wallet },
        { name: "Commissions", path: "/commissions", icon: Coins },
        { name: "Receipts", path: "/receipts", icon: ReceiptText },
        { name: "Reports", path: "/reports", icon: BarChart3 },
        { name: "Settings", path: "/settings", icon: Settings },
      ];
    } else if (user.role === "Employee") {
      return [
        ...baseNav,
        { name: "Members", path: "/members", icon: Users },
        { name: "Daily Collection", path: "/daily-collection", icon: Wallet },
        { name: "My Commissions", path: "/commissions", icon: Coins },
        { name: "Receipts", path: "/receipts", icon: ReceiptText },
      ];
    } else {
      // Member
      return [
        { name: "My Profile", path: "/members", icon: UserIcon },
        { name: "My Receipts", path: "/receipts", icon: ReceiptText },
      ];
    }
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-[#0f172a] text-slate-300 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col hidden md:flex`}
      >
        <div className="p-6 flex items-center space-x-3 h-[72px]">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
              SMART SAVE
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-4 overflow-y-auto mt-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-all w-full"
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-2 p-2 rounded-lg hover:bg-slate-100 hidden md:block text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 hidden sm:block">
              Administrator Dashboard
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded hidden sm:inline-block">
              FINANCE
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <Bell className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{user.username}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-50 relative">
          {(showBackupReminder && (user.role === "Super Admin" || user.role === "Administrator")) && (
            <div className="absolute top-4 right-8 left-8 sm:left-auto z-50 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-lg animate-in slide-in-from-top-4">
              <div className="bg-blue-100 p-2 rounded-full shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900">Backup Recommended</h4>
                <p className="text-xs text-blue-700 mt-1">It's been a while since your last backup. We recommend downloading a backup of your data to prevent loss.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleBackup}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Backup Now
                </button>
                <button
                  onClick={dismissReminder}
                  className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
