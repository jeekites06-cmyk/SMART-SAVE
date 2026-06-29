import React, { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Lock,
  Key,
  Check,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  FileText,
  CheckCheck,
  Camera,
  Trash2,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "member" | "collection" | "due" | "report";
  isRead: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "New Member Registered",
    description:
      "A new member profile has been authorized and registered into the database.",
    time: "Today • 10:30 AM",
    type: "member",
    isRead: false,
  },
  {
    id: "2",
    title: "Daily Collection Completed",
    description:
      "All standard daily payment collections from assigned agents have been synchronized.",
    time: "Today • 09:15 AM",
    type: "collection",
    isRead: false,
  },
  {
    id: "3",
    title: "12 Members Payment Due",
    description:
      "Warning: Several accounts have entered outstanding collection cycles.",
    time: "Today • 08:00 AM",
    type: "due",
    isRead: false,
  },
  {
    id: "4",
    title: "Report Generated",
    description:
      "The analytical financial summary has been compiled and is now available.",
    time: "Yesterday",
    type: "report",
    isRead: true,
  },
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: User;
}

export default function Layout({ children, onLogout, user }: LayoutProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();
  const {
    backupData,
    settings,
    employees,
    updateEmployee,
    updateSettings,
    members,
    collections,
    updateMember,
    logAudit,
  } = useData();
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "profile" | "password" | "account" | "notifications" | null
  >(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Notification States
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("smartsave_notifications_list");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return initialNotifications;
  });

  useEffect(() => {
    localStorage.setItem(
      "smartsave_notifications_list",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  // States for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPwdCurrent, setShowPwdCurrent] = useState(false);
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdConfirm, setShowPwdConfirm] = useState(false);

  // States for Account Preferences (for Employees/Members who can't access settings)
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [accountSuccess, setAccountSuccess] = useState(false);

  // Find corresponding employee if logged in user is Employee
  const loggedInEmployee = React.useMemo(() => {
    if (user.role === "Employee") {
      return employees.find((emp) => emp.username === user.username);
    }
    return null;
  }, [user.username, user.role, employees]);

  // Find corresponding member if logged in user is Member
  const loggedInMember = React.useMemo(() => {
    if (user.role === "Member") {
      return members.find(
        (m) => m.id === user.memberId || m.name === user.username,
      );
    }
    return null;
  }, [user.username, user.role, user.memberId, members]);

  // Unified resolver for active user's profile photo
  const resolvedUserPhoto = React.useMemo(() => {
    if (user.photo) return user.photo;
    if (user.role === "Employee") {
      const emp = employees.find((e) => e.username === user.username);
      return emp?.photo;
    }
    if (user.role === "Member") {
      const mem = members.find(
        (m) => m.id === user.memberId || m.name === user.username,
      );
      return mem?.photo;
    }
    return settings?.adminPhoto;
  }, [
    user.photo,
    user.role,
    user.username,
    user.memberId,
    employees,
    members,
    settings?.adminPhoto,
  ]);

  const unpaidTodayCount = React.useMemo(() => {
    if (!members || !collections) return 0;
    const todayDateStr = new Date().toISOString().split("T")[0];
    return members.filter((m) => {
      const plans = m.plans || [
        {
          id: `${m.id}-PLAN-1`,
          dailyAmount: parseInt(m.dailyAmount || "127", 10),
          status: m.status === "Active" ? "Active" : "Closed",
          startDate: m.joinDate,
        },
      ];
      const activePlans = plans.filter((p) => p.status === "Active");
      const totalDailyAmount =
        activePlans.reduce((sum, p) => sum + p.dailyAmount, 0) ||
        parseInt(m.dailyAmount || "127", 10);

      const mCols = collections.filter(
        (c) => c.memberId === m.id && c.type === "Daily Deposit",
      );
      const todayPaid = mCols.some(
        (c) =>
          c.timestamp.startsWith(todayDateStr) &&
          parseInt(c.amount || "0", 10) >= totalDailyAmount,
      );
      return !todayPaid && totalDailyAmount > 0;
    }).length;
  }, [members, collections]);

  useEffect(() => {
    if (user.role === "Employee" && loggedInEmployee) {
      setContactName(loggedInEmployee.name || "");
      setContactPhone(loggedInEmployee.phone || "");
      setContactEmail(loggedInEmployee.email || "");
      setContactAddress(loggedInEmployee.address || "");
    } else if (user.role === "Member" && loggedInMember) {
      setContactName(loggedInMember.name || "");
      setContactPhone(loggedInMember.phone || "");
      setContactEmail((loggedInMember as any).email || "");
      setContactAddress(loggedInMember.address || "");
    } else {
      setContactName(settings?.adminName || user.username || "");
      setContactPhone(settings?.adminPhone || "");
      setContactEmail(settings?.adminEmail || "");
      setContactAddress(settings?.address || "");
    }
  }, [loggedInEmployee, loggedInMember, settings, user.role, user.username]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasNumber = /[0-9]/;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    if (!minLength.test(newPassword)) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (!hasUpper.test(newPassword)) {
      setPasswordError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!hasLower.test(newPassword)) {
      setPasswordError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!hasNumber.test(newPassword)) {
      setPasswordError("Password must contain at least one number.");
      return;
    }
    if (!hasSpecial.test(newPassword)) {
      setPasswordError("Password must contain at least one special character.");
      return;
    }

    // Check role and update password
    if (user.role === "Super Admin" || user.role === "Administrator") {
      const actualCurrent = settings.adminPassword || "Ani@2024";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateSettings({ adminPassword: newPassword });
      logAudit("Password Change", `Super Admin changed their password`);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (user.role === "Employee") {
      if (!loggedInEmployee) {
        setPasswordError("Employee record not found.");
        return;
      }
      const actualCurrent = loggedInEmployee.password || "emp123";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateEmployee(loggedInEmployee.id, { password: newPassword });
      logAudit(
        "Password Change",
        `Employee ${loggedInEmployee.username} changed their password`,
      );
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (user.role === "Member") {
      if (!loggedInMember) {
        setPasswordError("Member record not found.");
        return;
      }
      const actualCurrent = loggedInMember.password || "123456";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateMember(loggedInMember.id, { password: newPassword } as any);
      logAudit(
        "Password Change",
        `Member ${loggedInMember.name} changed their password`,
      );
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordSuccess(true);
    }
  };

  const handleAccountUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSuccess(false);

    if (user.role === "Employee" && loggedInEmployee) {
      updateEmployee(loggedInEmployee.id, {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        address: contactAddress,
      });
      logAudit(
        "Profile Update",
        `Employee ${loggedInEmployee.username} updated their profile`,
      );
      setAccountSuccess(true);
    } else if (user.role === "Member" && loggedInMember) {
      updateMember(loggedInMember.id, {
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        address: contactAddress,
      } as any);
      logAudit("Profile Update", `Member ${user.name} updated their profile`);
      setAccountSuccess(true);
    } else {
      updateSettings({
        ...settings,
        adminName: contactName,
        adminPhone: contactPhone,
        adminEmail: contactEmail,
      });
      logAudit("Profile Update", `Admin updated their profile`);
      setAccountSuccess(true);
    }
  };

  useEffect(() => {
    const lastBackup = localStorage.getItem("smartsave_last_backup");
    const today = new Date().getTime();
    if (!lastBackup) {
      setShowBackupReminder(true);
    } else {
      const daysSinceBackup =
        (today - parseInt(lastBackup, 10)) / (1000 * 3600 * 24);
      if (daysSinceBackup > 7) {
        setShowBackupReminder(true);
      }
    }
  }, []);

  const handleBackup = () => {
    backupData();
    localStorage.setItem(
      "smartsave_last_backup",
      new Date().getTime().toString(),
    );
    setShowBackupReminder(false);
  };

  const dismissReminder = () => {
    localStorage.setItem(
      "smartsave_last_backup",
      new Date().getTime().toString(),
    );
    setShowBackupReminder(false);
  };

  const getNavigation = () => {
    const baseNav = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ];

    if (user.role === "Super Admin" || user.role === "Administrator") {
      const adminNav = [
        ...baseNav,
        { name: "Members", path: "/members", icon: Users },
        {
          name: "Employee Management",
          path: "/employee-management",
          icon: UserCheck,
        },
        { name: "Daily Collection", path: "/daily-collection", icon: Wallet },
        { name: "Commissions", path: "/commissions", icon: Coins },
        { name: "Receipts", path: "/receipts", icon: ReceiptText },
        { name: "Reminder Center", path: "/reminders", icon: Bell },
        { name: "Reports", path: "/reports", icon: BarChart3 },
        { name: "Settings", path: "/settings", icon: Settings },
      ];
      if (user.role === "Super Admin") {
        adminNav.push({
          name: "Activity Log",
          path: "/activity-log",
          icon: History,
        });
        adminNav.push({
          name: "Security Audit",
          path: "/security-audit",
          icon: Shield,
        });
      }
      return adminNav;
    } else if (user.role === "Employee") {
      return [
        ...baseNav,
        { name: "Members", path: "/members", icon: Users },
        { name: "Daily Collection", path: "/daily-collection", icon: Wallet },
        { name: "My Commissions", path: "/commissions", icon: Coins },
        { name: "Receipts", path: "/receipts", icon: ReceiptText },
        { name: "Reminder Center", path: "/reminders", icon: Bell },
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

  let mainBgColor = "bg-[#EEF4FF]";
  if (location.pathname.startsWith("/members")) {
    mainBgColor = "bg-[#ECFDF5]";
  } else if (location.pathname.startsWith("/employee-management")) {
    mainBgColor = "bg-[#FFF7ED]";
  } else if (location.pathname.startsWith("/daily-collection")) {
    mainBgColor = "bg-[#FEF3C7]";
  } else if (location.pathname.startsWith("/commissions")) {
    mainBgColor = "bg-[#F3E8FF]";
  } else if (location.pathname.startsWith("/receipts")) {
    mainBgColor = "bg-[#E0F2FE]";
  } else if (location.pathname.startsWith("/reminders")) {
    mainBgColor = "bg-[#FFE4E6]";
  } else if (location.pathname.startsWith("/reports")) {
    mainBgColor = "bg-[#E5E7EB]";
  } else if (location.pathname.startsWith("/settings")) {
    mainBgColor = "bg-[#E0E7FF]";
  } else if (location.pathname.startsWith("/profile")) {
    mainBgColor = "bg-[#F8FAFC]";
  } else if (
    location.pathname === "/" ||
    location.pathname.startsWith("/dashboard")
  ) {
    mainBgColor = "bg-[#EEF4FF]";
  }

  return (
    <div className={`min-h-screen ${mainBgColor} flex`}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-[#0f172a] text-slate-300 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col hidden md:flex`}
      >
        <div className="p-6 flex items-center space-x-3 h-[72px]">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden p-0.5">
            {settings?.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Wallet className="w-6 h-6 text-white" />
            )}
          </div>
          {sidebarOpen && (
            <span className="text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap overflow-hidden text-ellipsis">
              {settings?.companyName || "SMART SAVE"}
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
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
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() =>
                  setNotificationDropdownOpen(!notificationDropdownOpen)
                }
                title={
                  unpaidTodayCount > 0
                    ? `${unpaidTodayCount} Members have not paid today.`
                    : "Notifications"
                }
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative cursor-pointer"
              >
                <Bell className="w-6 h-6" />
                {notifications.filter((n) => !n.isRead).length +
                  (unpaidTodayCount > 0 ? 1 : 0) >
                  0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {notifications.filter((n) => !n.isRead).length +
                      (unpaidTodayCount > 0 ? 1 : 0)}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-slate-800 text-sm">
                          Notifications
                        </span>
                        {notifications.filter((n) => !n.isRead).length > 0 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold text-[10px]">
                            {notifications.filter((n) => !n.isRead).length} New
                          </span>
                        )}
                      </div>
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotifications(
                              notifications.map((n) => ({
                                ...n,
                                isRead: true,
                              })),
                            );
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1"
                        >
                          <CheckCheck className="w-3.5 h-3.5 mr-1" />
                          <span>Mark All as Read</span>
                        </button>
                      )}
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {unpaidTodayCount > 0 && (
                        <div
                          onClick={() => {
                            setNotificationDropdownOpen(false);
                            navigate("/reminders");
                          }}
                          className="p-4 bg-rose-50/80 hover:bg-rose-50 border-b border-rose-100 flex items-start space-x-3 transition-colors cursor-pointer relative"
                        >
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 bg-rose-100 text-rose-600">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="text-xs font-bold text-rose-800">
                              Payment Due Alert
                            </p>
                            <p className="text-[11px] text-rose-700 mt-0.5 font-semibold">
                              {unpaidTodayCount} Members have not paid today.
                            </p>
                            <p className="text-[10px] text-rose-500 mt-1">
                              Live Update • Tap to view
                            </p>
                          </div>
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        </div>
                      )}
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium">
                          No new notifications.
                        </div>
                      ) : (
                        notifications.map((n) => {
                          let iconBg = "bg-blue-50 text-blue-600";
                          let IconComponent = FileText;

                          if (n.type === "member") {
                            iconBg = "bg-emerald-50 text-emerald-600";
                            IconComponent = UserPlus;
                          } else if (n.type === "collection") {
                            iconBg = "bg-amber-50 text-amber-600";
                            IconComponent = Coins;
                          } else if (n.type === "due") {
                            iconBg = "bg-red-50 text-red-600";
                            IconComponent = AlertCircle;
                          }

                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotifications(
                                  notifications.map((item) =>
                                    item.id === n.id
                                      ? { ...item, isRead: true }
                                      : item,
                                  ),
                                );
                              }}
                              className={`p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                                !n.isRead ? "bg-blue-50/20" : ""
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
                              >
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0 pr-4">
                                <p
                                  className={`text-xs ${!n.isRead ? "font-bold text-slate-800" : "text-slate-600"}`}
                                >
                                  {n.title}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                                  {n.description}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {n.time}
                                </p>
                              </div>
                              {!n.isRead && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 flex justify-between bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationDropdownOpen(false);
                          setActiveModal("notifications");
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        View All Notifications
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 pl-4 border-l border-slate-100 cursor-pointer focus:outline-none focus:ring-0 group select-none text-left"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    SMART SAVE
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-lg flex items-center justify-center font-bold text-slate-600 group-hover:border-blue-500 transition-colors overflow-hidden">
                  {resolvedUserPhoto ? (
                    <img
                      src={resolvedUserPhoto}
                      alt={user.username}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100 mb-1 bg-slate-50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-lg flex items-center justify-center font-bold text-slate-600 overflow-hidden shrink-0">
                        {resolvedUserPhoto ? (
                          <img
                            src={resolvedUserPhoto}
                            alt={user.username}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-800 truncate">
                          {user.role === "Employee" && loggedInEmployee
                            ? loggedInEmployee.name
                            : user.role === "Member" && loggedInMember
                              ? loggedInMember.name
                              : settings?.adminName || user.username}
                        </span>
                        <span className="text-xs text-slate-500 font-medium truncate">
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <UserIcon className="w-4 h-4 mr-2.5 text-slate-400" />
                        My Profile
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <Key className="w-4 h-4 mr-2.5 text-slate-400" />
                        Change Password
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left cursor-pointer"
                      >
                        <Settings className="w-4 h-4 mr-2.5 text-slate-400" />
                        Account Settings
                      </button>
                    </div>

                    <div className="border-t border-slate-100 p-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left font-medium cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className={`flex-1 p-8 overflow-y-auto ${mainBgColor} relative`}>
          {showBackupReminder &&
            (user.role === "Super Admin" || user.role === "Administrator") && (
              <div className="absolute top-4 right-8 left-8 sm:left-auto z-50 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-lg animate-in slide-in-from-top-4">
                <div className="bg-blue-100 p-2 rounded-full shrink-0">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-900">
                    Backup Recommended
                  </h4>
                  <p className="text-xs text-blue-700 mt-1">
                    It's been a while since your last backup. We recommend
                    downloading a backup of your data to prevent loss.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleBackup}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white text-xs font-medium rounded-md transition-colors"
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

      {/* Profile Modal */}
      <AnimatePresence>
        {activeModal === "profile" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-600" /> My Profile
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group mb-3">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 shadow-md overflow-hidden bg-slate-50 flex items-center justify-center">
                      {tempPhoto ? (
                        <img
                          src={tempPhoto}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : resolvedUserPhoto ? (
                        <img
                          src={resolvedUserPhoto}
                          alt={user.username}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl font-extrabold text-blue-600 uppercase">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <label className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-2 rounded-full cursor-pointer hover:from-blue-700 hover:to-blue-900 transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              setPhotoError("Maximum size: 2 MB.");
                              return;
                            }
                            const validFormats = [
                              "image/jpeg",
                              "image/jpg",
                              "image/png",
                              "image/webp",
                            ];
                            if (!validFormats.includes(file.type)) {
                              setPhotoError(
                                "Supported formats: JPG, PNG, WEBP.",
                              );
                              return;
                            }
                            setPhotoError(null);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setTempPhoto(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {photoError && (
                    <p className="text-xs text-red-500 font-semibold mb-2">
                      {photoError}
                    </p>
                  )}

                  {/* Actions for preview and removal */}
                  <div className="flex gap-2 mb-3">
                    {tempPhoto && (
                      <>
                        <button
                          onClick={() => {
                            if (user.role === "Employee" && loggedInEmployee) {
                              updateEmployee(loggedInEmployee.id, {
                                photo: tempPhoto,
                              });
                              logAudit(
                                "Profile Update",
                                `Employee ${loggedInEmployee.username} updated their profile photo`,
                              );
                            } else if (
                              user.role === "Member" &&
                              user.memberId
                            ) {
                              updateMember(user.memberId, { photo: tempPhoto });
                              logAudit(
                                "Profile Update",
                                `Member ${user.name} updated their profile photo`,
                              );
                            } else {
                              updateSettings({
                                ...settings,
                                adminPhoto: tempPhoto,
                              });
                              logAudit(
                                "Profile Update",
                                `Admin updated their profile photo`,
                              );
                            }
                            login({ ...user, photo: tempPhoto });
                            setTempPhoto(null);
                          }}
                          className="text-xs px-2.5 py-1 bg-emerald-600 text-white rounded font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Save Photo
                        </button>
                        <button
                          onClick={() => {
                            setTempPhoto(null);
                            setPhotoError(null);
                          }}
                          className="text-xs px-2.5 py-1 bg-slate-200 text-slate-700 rounded font-semibold hover:bg-slate-300 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {!tempPhoto && resolvedUserPhoto && (
                      <button
                        onClick={() => {
                          if (window.confirm("Remove your profile photo?")) {
                            if (user.role === "Employee" && loggedInEmployee) {
                              updateEmployee(loggedInEmployee.id, {
                                photo: "",
                              });
                              logAudit(
                                "Profile Update",
                                `Employee ${loggedInEmployee.username} removed their profile photo`,
                              );
                            } else if (
                              user.role === "Member" &&
                              user.memberId
                            ) {
                              updateMember(user.memberId, { photo: "" });
                              logAudit(
                                "Profile Update",
                                `Member ${user.name} removed their profile photo`,
                              );
                            } else {
                              updateSettings({ ...settings, adminPhoto: "" });
                              logAudit(
                                "Profile Update",
                                `Admin removed their profile photo`,
                              );
                            }
                            login({ ...user, photo: "" });
                            setTempPhoto(null);
                          }
                        }}
                        className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                      </button>
                    )}
                  </div>

                  <h4 className="text-lg font-extrabold text-slate-800">
                    {user.username}
                  </h4>
                  <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full uppercase tracking-wider mt-1.5">
                    {user.role}
                  </span>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Username / Login ID
                    </p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">
                      {user.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      Access Level
                    </p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 flex items-center">
                      <Shield className="w-4 h-4 mr-1.5 text-emerald-500" />
                      {user.role === "Super Admin" ||
                      user.role === "Administrator"
                        ? "Full Access"
                        : "Limited Access"}
                    </p>
                  </div>

                  {user.role === "Employee" && loggedInEmployee && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Full Name
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">
                            {loggedInEmployee.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Phone
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">
                            {loggedInEmployee.phone}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Email
                          </p>
                          <p
                            className="text-sm font-medium text-slate-800 mt-0.5 truncate"
                            title={loggedInEmployee.email}
                          >
                            {loggedInEmployee.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                            Designation
                          </p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">
                            {loggedInEmployee.designation}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {!(user.role === "Employee" && loggedInEmployee) &&
                    !(user.role === "Member" && loggedInMember) && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Full Name
                            </p>
                            <p className="text-sm font-medium text-slate-800 mt-0.5">
                              {settings?.adminName ||
                                user.name ||
                                "Administrator"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Phone
                            </p>
                            <p className="text-sm font-medium text-slate-800 mt-0.5">
                              {settings?.adminPhone || "Not set"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Email
                            </p>
                            <p
                              className="text-sm font-medium text-slate-800 mt-0.5 truncate"
                              title={settings?.adminEmail}
                            >
                              {settings?.adminEmail || "Not set"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                              Managed Brand
                            </p>
                            <p className="text-sm font-medium text-slate-800 mt-0.5">
                              {settings?.companyName ||
                                "SMART SAVE FINANCIAL SYSTEMS"}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {activeModal === "password" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-blue-600" /> Change
                  Password
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordChange}>
                <div className="p-6 space-y-4">
                  {passwordSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-800">
                        Password Changed Successfully!
                      </h4>
                      <p className="text-xs text-emerald-600 mt-1">
                        Your security credentials have been updated
                        successfully.
                      </p>
                    </div>
                  ) : (
                    <>
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-red-700 text-xs flex items-start">
                          <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                          <span>{passwordError}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPwdCurrent ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="w-full border border-slate-100 px-3 py-2 pl-9 pr-10 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all"
                          />
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowPwdCurrent(!showPwdCurrent)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPwdCurrent ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPwdNew ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="w-full border border-slate-100 px-3 py-2 pl-9 pr-10 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all"
                          />
                          <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowPwdNew(!showPwdNew)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPwdNew ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {newPassword &&
                          (() => {
                            let strength = 0;
                            if (newPassword.length >= 8) strength++;
                            if (/[A-Z]/.test(newPassword)) strength++;
                            if (/[a-z]/.test(newPassword)) strength++;
                            if (/[0-9]/.test(newPassword)) strength++;
                            if (
                              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                                newPassword,
                              )
                            )
                              strength++;

                            let label = "Weak";
                            let color = "bg-red-500";
                            let textColor = "text-red-500";
                            if (strength >= 3 && strength <= 4) {
                              label = "Medium";
                              color = "bg-yellow-500";
                              textColor = "text-yellow-500";
                            }
                            if (strength === 5) {
                              label = "Strong";
                              color = "bg-emerald-500";
                              textColor = "text-emerald-500";
                            }

                            return (
                              <div className="flex items-center gap-2 mt-2 text-[10px]">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                                  <div
                                    className={`h-full ${color}`}
                                    style={{
                                      width: `${(strength / 5) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                                <span
                                  className={`font-bold ${textColor} uppercase tracking-wider`}
                                >
                                  {label}
                                </span>
                              </div>
                            );
                          })()}
                        <p className="text-[10px] text-slate-400 mt-1">
                          Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1
                          special character.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPwdConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="w-full border border-slate-100 px-3 py-2 pl-9 pr-10 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all"
                          />
                          <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <button
                            type="button"
                            onClick={() => setShowPwdConfirm(!showPwdConfirm)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showPwdConfirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {passwordSuccess ? "Done" : "Cancel"}
                  </button>
                  {!passwordSuccess && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg cursor-pointer"
                    >
                      Update Password
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Account Preferences Modal */}
      <AnimatePresence>
        {activeModal === "account" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" /> Account
                  Preferences
                </h3>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAccountUpdate}>
                <div className="p-6 space-y-4">
                  {accountSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-emerald-800">
                        Preferences Updated!
                      </h4>
                      <p className="text-xs text-emerald-600 mt-1">
                        Your contact details have been successfully saved.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-slate-600 text-xs">
                        Update your personal contact details here. Any other
                        system updates must be requested through your
                        administrator.
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full border border-slate-100 px-3 py-2 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full border border-slate-100 px-3 py-2 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="Enter email address"
                          className="w-full border border-slate-100 px-3 py-2 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">
                          Address
                        </label>
                        <textarea
                          value={contactAddress}
                          onChange={(e) => setContactAddress(e.target.value)}
                          placeholder="Enter current address"
                          rows={3}
                          className="w-full border border-slate-100 px-3 py-2 rounded-lg text-sm bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all resize-none font-medium"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {accountSuccess ? "Done" : "Cancel"}
                  </button>
                  {!accountSuccess && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg cursor-pointer"
                    >
                      Save Preferences
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {activeModal === "notifications" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-blue-600" /> System
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <button
                      onClick={() => {
                        setNotifications(
                          notifications.map((n) => ({ ...n, isRead: true })),
                        );
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5 mr-1" />
                      <span>Mark all as read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm font-medium">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((n) => {
                    let iconBg = "bg-blue-50 text-blue-600";
                    let IconComponent = FileText;

                    if (n.type === "member") {
                      iconBg = "bg-emerald-50 text-emerald-600";
                      IconComponent = UserPlus;
                    } else if (n.type === "collection") {
                      iconBg = "bg-amber-50 text-amber-600";
                      IconComponent = Coins;
                    } else if (n.type === "due") {
                      iconBg = "bg-red-50 text-red-600";
                      IconComponent = AlertCircle;
                    }

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          setNotifications(
                            notifications.map((item) =>
                              item.id === n.id
                                ? { ...item, isRead: true }
                                : item,
                            ),
                          );
                        }}
                        className={`py-4 flex items-start space-x-4 hover:bg-slate-50/50 px-2 rounded-2xl transition-colors cursor-pointer relative ${
                          !n.isRead ? "bg-blue-50/5" : ""
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between">
                            <p
                              className={`text-sm ${!n.isRead ? "font-bold text-slate-800" : "text-slate-600"}`}
                            >
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold text-[9px] uppercase tracking-wider">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {n.time}
                          </p>
                          <p className="text-xs text-slate-500 mt-1.5">
                            {n.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setNotifications(initialNotifications);
                  }}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer mr-auto"
                >
                  Reset List
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
