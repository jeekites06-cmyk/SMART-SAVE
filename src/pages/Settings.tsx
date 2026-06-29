import React, { useState } from "react";
import {
  Building2,
  Coins,
  FileText,
  Shield,
  Database,
  Bell,
  History,
  Save,
  Upload,
  Download,
  Trash2,
  Key,
  Users,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Phone,
  Mail,
  Lock,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Clock
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const {
    settings,
    auditLogs,
    loginHistory,
    updateSettings,
    backupData,
    restoreData,
    employees,
    updateEmployee
  } = useData();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "general" | "financial" | "receipt" | "user" | "backup" | "notification" | "audit"
  >("general");

  // Success Notification banner
  const [successMsg, setSuccessMsg] = useState("");
  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Form Data State
  const [formData, setFormData] = useState({
    companyName: settings?.companyName || "Smart Save Financial Systems",
    registrationNumber: settings?.registrationNumber || "REG-2024-8899",
    address: settings?.address || "123 Financial Hub, Business Park, Phase 1, City Center",
    contactEmail: settings?.contactEmail || "support@smartsave.com",
    supportPhone: settings?.supportPhone || "+91 1800 123 4567",
    website: settings?.website || "https://www.smartsave.com",
    gstNumber: settings?.gstNumber || "29GGGGG1314R9Z6",
    companyLogo: settings?.companyLogo || "",

    registrationFee: settings?.registrationFee || "2500",
    dailyDeposit: settings?.dailyDeposit || "127",
    memberSavings: settings?.memberSavings || "102",
    companyCollection: settings?.companyCollection || "25",
    bonusPercentage: settings?.bonusPercentage || "60",
    companyProfitPercentage: settings?.companyProfitPercentage || "0",
    employeeCommissionPerCollection: settings?.employeeCommissionPerCollection || "5",
    lateFeePenalty: settings?.lateFeePenalty || "300",
    planDuration: settings?.planDuration || "180",
    gracePeriod: settings?.gracePeriod || "30",

    receiptPrefix: settings?.receiptPrefix || "RCT",
    receiptFooter: settings?.receiptFooter || "Thank you for saving with Smart Save. Keep saving, keep growing!",
    companyStamp: settings?.companyStamp || "",
    authorizedSignature: settings?.authorizedSignature || "",
    autoReceiptNumber: settings?.autoReceiptNumber !== false,

    adminUsername: settings?.adminUsername || "smartadmin",
    adminPassword: settings?.adminPassword || "Ani@2024",
    employeePasswordReset: settings?.employeePasswordReset || "emp123",
    sessionTimeout: settings?.sessionTimeout || "15",
    
    // New Security Module Fields
    sessionTimeoutValue: settings?.sessionTimeoutValue || "30",
    autoLogoutEnabled: settings?.autoLogoutEnabled ?? true,
    logoutOnBrowserClose: settings?.logoutOnBrowserClose ?? false,
    maxFailedLoginAttempts: settings?.maxFailedLoginAttempts || 5,

    autoBackup: settings?.autoBackup !== false,
    backupInterval: settings?.backupInterval || "Daily",

    whatsappEnabled: settings?.whatsappEnabled !== false,
    smsEnabled: settings?.smsEnabled !== false,
    emailNotificationsEnabled: !!settings?.emailNotificationsEnabled,
    paymentReminderDays: settings?.paymentReminderDays || "1",
    maturityReminderDays: settings?.maturityReminderDays || "7",
  });

  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Form Input Change Handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Checkbox/Toggle Change Handler Helper
  const handleToggle = (name: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Base64 File Uploader Helper
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "companyLogo" | "companyStamp" | "authorizedSignature"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size should be less than 1.5MB for local storage optimization.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData((prev) => ({ ...prev, [fieldName]: base64 }));
      showNotification(`Uploaded preview for ${fieldName.replace(/([A-Z])/g, " $1")}`);
    };
    reader.readAsDataURL(file);
  };

  // Save Settings Changes
  const handleSave = () => {
    const updatedData = {
      ...formData,
      dailyDeposit: "127",
      memberSavings: "102",
      companyCollection: "25"
    };
    updateSettings(updatedData);
    showNotification("Financial Rules Updated Successfully.");
  };

  // Restore DB File Upload Handler
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (
          window.confirm(
            "Are you sure you want to restore data? This will overwrite all active collections, members and settings."
          )
        ) {
          restoreData(content);
          showNotification("Database restored successfully!");
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  // Employee Password Reset Handler
  const handleResetEmployeePassword = (empId: string, empName: string) => {
    const defaultPwd = formData.employeePasswordReset || "emp123";
    if (
      window.confirm(
        `Are you sure you want to reset password for employee "${empName}" (${empId}) to the default "${defaultPwd}"?`
      )
    ) {
      updateEmployee(empId, { password: defaultPwd });
      showNotification(`Password for ${empName} has been reset to "${defaultPwd}"`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#4F46E5] to-[#312e81]">Company Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure general info, financial parameters, custom PDF branding, admin access, backups and automatic alerts.
        </p>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2.5 shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Main Settings Navigation Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Configuration Tabs
              </span>
            </div>
            <nav className="flex flex-col divide-y divide-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "general"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>General Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("financial")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "financial"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <Coins className="w-4 h-4 shrink-0" />
                <span>Financial Rules</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("receipt")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "receipt"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Receipt Setup</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("user")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "user"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span>User Security</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("backup")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "backup"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <Database className="w-4 h-4 shrink-0" />
                <span>Backup & Database</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notification")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "notification"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notification Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`flex items-center gap-3 px-4 py-3 font-medium text-xs sm:text-sm text-left transition-all ${
                  activeTab === "audit"
                    ? "bg-[#E0E7FF] text-[#4F46E5] border-l-4 border-[#4F46E5] font-bold"
                    : "text-slate-600 hover:bg-slate-50 border-l-4 border-transparent"
                }`}
              >
                <History className="w-4 h-4 shrink-0" />
                <span>System Security Log</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Dynamic Tab Content Area */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden min-h-[480px] flex flex-col justify-between">
          <div className="p-6">
            {/* TAB 1: GENERAL PROFILE */}
            {activeTab === "general" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">General Settings</h2>
                  <p className="text-xs text-slate-500">Configure identity and official business contacts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Logo Row with preview */}
                  <div className="md:col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                      {formData.companyLogo ? (
                        <img
                          src={formData.companyLogo}
                          alt="Company Logo Preview"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <p className="text-xs font-bold text-slate-700">Company Brand Logo</p>
                      <p className="text-[10px] text-slate-400">
                        Upload custom logo to print directly on payment invoice receipts (suggested 1:1 format).
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                        <label className="bg-gradient-to-r from-[#4F46E5] to-[#312e81] hover:from-[#4338ca] hover:to-[#3730a3] text-white px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors flex items-center gap-1">
                          <Upload className="w-3 h-3" /> Upload Logo
                          <input
                            type="file"
                            accept=".png, .jpg, .jpeg, .svg, image/png, image/jpeg, image/jpg, image/svg+xml, image/*"
                            onChange={(e) => handleImageUpload(e, "companyLogo")}
                            className="hidden"
                          />
                        </label>
                        {formData.companyLogo && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, companyLogo: "" }))}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Smart Save Financial Systems"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registration Number *</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      placeholder="e.g. REG-2024-8899"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="supportPhone"
                        value={formData.supportPhone}
                        onChange={handleChange}
                        placeholder="e.g. +91 1800 123 4567"
                        className="w-full border-slate-100 pl-10 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="e.g. support@smartsave.com"
                        className="w-full border-slate-100 pl-10 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Website URL</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="e.g. https://www.smartsave.com"
                        className="w-full border-slate-100 pl-10 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">GST Number (Optional)</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="e.g. 29GGGGG1314R9Z6"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registered Address *</label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Enter complete company registered headquarters address..."
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FINANCIAL SETTINGS */}
            {activeTab === "financial" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">Financial Settings</h2>
                  <p className="text-xs text-slate-500">Configure deposit algorithms, incentives, and plan schedules.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registration Fee (₹) [Fixed] *</label>
                    <input
                      type="number"
                      name="registrationFee"
                      value="2500"
                      readOnly
                      disabled
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-100 border text-right font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily Deposit (₹) [Fixed] *</label>
                    <input
                      type="number"
                      name="dailyDeposit"
                      value="127"
                      readOnly
                      disabled
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-100 border text-right font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Member Savings Fund Allocation (₹) [Fixed] *</label>
                    <input
                      type="number"
                      name="memberSavings"
                      value="102"
                      readOnly
                      disabled
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-100 border text-right font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Company Collection Deductible (₹) [Fixed] *</label>
                    <input
                      type="number"
                      name="companyCollection"
                      value="25"
                      readOnly
                      disabled
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-100 border text-right font-medium text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee Incentive Commission (₹/col) *</label>
                    <input
                      type="number"
                      name="employeeCommissionPerCollection"
                      value={formData.employeeCommissionPerCollection}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Late Payment One-time Fine (₹) *</label>
                    <input
                      type="number"
                      name="lateFeePenalty"
                      value={formData.lateFeePenalty}
                      onChange={handleChange}
                      placeholder="e.g. 300"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Late Payment Grace Period (Days) *</label>
                    <input
                      type="number"
                      name="gracePeriod"
                      value={formData.gracePeriod}
                      onChange={handleChange}
                      placeholder="e.g. 30"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border text-right"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RECEIPT SETTINGS */}
            {activeTab === "receipt" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">Receipt Settings</h2>
                  <p className="text-xs text-slate-500">Customize layout, prefixes, footers, stamps and signatures.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Receipt Number Prefix *</label>
                      <input
                        type="text"
                        name="receiptPrefix"
                        value={formData.receiptPrefix}
                        onChange={handleChange}
                        placeholder="e.g. RCT"
                        className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>

                    <div className="flex flex-col justify-end pb-1">
                      <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoReceiptNumber"
                          checked={formData.autoReceiptNumber}
                          onChange={(e) => handleToggle("autoReceiptNumber", e.target.checked)}
                          className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#003366] w-4.5 h-4.5"
                        />
                        <span>Enable Auto Receipt Serialization</span>
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 ml-7">
                        Automatically assign incremental receipt IDs to new transactions.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Receipt Footer Disclaimer</label>
                    <textarea
                      name="receiptFooter"
                      rows={2}
                      value={formData.receiptFooter}
                      onChange={handleChange}
                      placeholder="Disclaimer shown at the bottom of printed receipts..."
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border resize-none"
                    />
                  </div>

                  {/* Stamp & Authorized Signature upload blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Stamp */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Official Company Stamp</span>
                        {formData.companyStamp && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, companyStamp: "" }))}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-red-100"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>

                      <div className="w-full h-32 rounded bg-white border border-slate-300 border-dashed flex items-center justify-center overflow-hidden">
                        {formData.companyStamp ? (
                          <img
                            src={formData.companyStamp}
                            alt="Company Stamp Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-3">
                            <span className="text-[11px] text-slate-400 italic block">No stamp uploaded</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">(Shows text line in PDF)</span>
                          </div>
                        )}
                      </div>

                      <label className="w-full bg-gradient-to-r from-[#4F46E5] to-[#312e81] hover:from-[#4338ca] hover:to-[#3730a3] text-white py-1.5 rounded text-xs font-semibold text-center cursor-pointer transition-colors block">
                        Upload Stamp Image
                        <input
                          type="file"
                          accept=".png, .jpg, .jpeg, .svg, image/png, image/jpeg, image/jpg, image/svg+xml, image/*"
                          onChange={(e) => handleImageUpload(e, "companyStamp")}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Signature */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Authorized Signature</span>
                        {formData.authorizedSignature && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, authorizedSignature: "" }))}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-red-100"
                          >
                            <Trash2 className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>

                      <div className="w-full h-32 rounded bg-white border border-slate-300 border-dashed flex items-center justify-center overflow-hidden">
                        {formData.authorizedSignature ? (
                          <img
                            src={formData.authorizedSignature}
                            alt="Authorized Signature Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-center p-3">
                            <span className="text-[11px] text-slate-400 italic block">No signature uploaded</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">(Shows standard sign line in PDF)</span>
                          </div>
                        )}
                      </div>

                      <label className="w-full bg-gradient-to-r from-[#4F46E5] to-[#312e81] hover:from-[#4338ca] hover:to-[#3730a3] text-white py-1.5 rounded text-xs font-semibold text-center cursor-pointer transition-colors block">
                        Upload Signature Image
                        <input
                          type="file"
                          accept=".png, .jpg, .jpeg, .svg, image/png, image/jpeg, image/jpg, image/svg+xml, image/*"
                          onChange={(e) => handleImageUpload(e, "authorizedSignature")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: USER SETTINGS */}
            {activeTab === "user" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">User & Password Access</h2>
                  <p className="text-xs text-slate-500">Configure administrator logins, automatic timeouts, and staff resets.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Username *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="adminUsername"
                        value={formData.adminUsername}
                        onChange={handleChange}
                        placeholder="Admin Username"
                        className="w-full border-slate-100 pl-10 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Access Password *</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        name="adminPassword"
                        value={formData.adminPassword}
                        onChange={handleChange}
                        placeholder="Enter system master password"
                        className="w-full border-slate-100 pl-10 pr-10 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showAdminPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee Default Reset Password *</label>
                    <input
                      type="text"
                      name="employeePasswordReset"
                      value={formData.employeePasswordReset}
                      onChange={handleChange}
                      placeholder="e.g. emp123"
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      The default fallback password applied to employee logins during instant reset actions below.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Advanced Security Module</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Session Inactivity Timeout *</label>
                      <select
                        name="sessionTimeoutValue"
                        value={formData.sessionTimeoutValue}
                        onChange={handleChange}
                        className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      >
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="Never">Never</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Failed Login Attempts *</label>
                      <input
                        type="number"
                        name="maxFailedLoginAttempts"
                        value={formData.maxFailedLoginAttempts}
                        onChange={handleChange}
                        placeholder="e.g. 5"
                        min="1"
                        max="20"
                        className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoLogoutEnabled}
                        onChange={(e) => setFormData({ ...formData, autoLogoutEnabled: e.target.checked })}
                        className="w-4 h-4 text-[#4F46E5] rounded border-slate-300 focus:ring-[#003366]"
                      />
                      <div>
                        <span className="block text-sm font-medium text-slate-700">Enable Auto Logout</span>
                        <span className="block text-[10px] text-slate-500">Automatically log out users when session expires</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.logoutOnBrowserClose}
                        onChange={(e) => setFormData({ ...formData, logoutOnBrowserClose: e.target.checked })}
                        className="w-4 h-4 text-[#4F46E5] rounded border-slate-300 focus:ring-[#003366]"
                      />
                      <div>
                        <span className="block text-sm font-medium text-slate-700">Logout on Browser Close</span>
                        <span className="block text-[10px] text-slate-500">Log out when the browser window is closed</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sub section: Live Password Reset Actions panel */}
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employee Access Controls</h4>
                      <p className="text-[10px] text-slate-500">Instantly reset active staff passwords to your default fallback above.</p>
                    </div>
                    <span className="text-[10px] text-[#312e81] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      {employees.length} Staff Profiles
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <div key={emp.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div>
                            <span className="text-xs font-bold text-slate-800">{emp.name}</span>
                            <div className="flex gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>ID: {emp.id}</span>
                              <span>Username: {emp.username}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleResetEmployeePassword(emp.id, emp.name)}
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-100 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors hover:border-slate-300 shadow-lg"
                          >
                            <RefreshCw className="w-3 h-3 text-blue-500" />
                            Reset Password
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No active employee profiles found in Employee Management.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BACKUP SETTINGS */}
            {activeTab === "backup" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">Backup & Database Administration</h2>
                  <p className="text-xs text-slate-500">Configure auto-backup schedules, export ledgers, or restore imports.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="autoBackup"
                        checked={formData.autoBackup}
                        onChange={(e) => handleToggle("autoBackup", e.target.checked)}
                        className="rounded border-slate-300 text-[#4F46E5] focus:ring-[#003366] w-4.5 h-4.5"
                      />
                      <span>Enable Scheduled Auto Backup</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1 ml-7">
                      Save database local backups dynamically in the browser environment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Backup Frequency Interval</label>
                    <select
                      name="backupInterval"
                      value={formData.backupInterval}
                      onChange={handleChange}
                      className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                    >
                      <option value="Daily">Daily (Every 24 Hours)</option>
                      <option value="Weekly">Weekly (Every 7 Days)</option>
                      <option value="Monthly">Monthly (Every 30 Days)</option>
                    </select>
                  </div>
                </div>

                {/* DB Actions Panel */}
                <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-[#4F46E5]" /> Export Database
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Download a complete schema JSON package of all active collections, employees, logins, and members.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={backupData}
                      className="w-full bg-gradient-to-r from-[#4F46E5] to-[#312e81] hover:from-[#4338ca] hover:to-[#3730a3] text-white py-2 rounded text-xs font-semibold shadow-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export / Download JSON
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/40 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Restore / Import Database
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Warning: Restoring data completely replaces and wipes existing records with the uploaded JSON backup package.
                      </p>
                    </div>
                    <label className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded text-xs font-semibold text-center cursor-pointer shadow-lg transition-colors block">
                      Import / Restore JSON
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: NOTIFICATION SETTINGS */}
            {activeTab === "notification" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-800">Notification & Alert Channels</h2>
                  <p className="text-xs text-slate-500">Configure messaging gateways, automatic receipts, and payment alerts.</p>
                </div>

                <div className="space-y-4">
                  {/* WhatsApp */}
                  <div className="flex items-start justify-between p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="text-xs font-bold text-slate-800">WhatsApp Notification Services</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 ml-4">
                        Send digital deposit receipts instantly via WhatsApp API redirect loops.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.whatsappEnabled}
                        onChange={(e) => handleToggle("whatsappEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* SMS */}
                  <div className="flex items-start justify-between p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <h4 className="text-xs font-bold text-slate-800">SMS Alert Gateway</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 ml-4">
                        Dispatch high-priority mobile text notifications for collections and registrations.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.smsEnabled}
                        onChange={(e) => handleToggle("smsEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4F46E5]"></div>
                    </label>
                  </div>

                  {/* Email */}
                  <div className="flex items-start justify-between p-3.5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <h4 className="text-xs font-bold text-slate-800">Email System Notifications</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 ml-4">
                        Send dynamic payment confirmations and administrative alert updates to client mailboxes.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.emailNotificationsEnabled}
                        onChange={(e) => handleToggle("emailNotificationsEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Payment Reminder Timing</label>
                      <select
                        name="paymentReminderDays"
                        value={formData.paymentReminderDays}
                        onChange={handleChange}
                        className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      >
                        <option value="0">Same Day (Collection Date)</option>
                        <option value="1">1 Day Before Due Date</option>
                        <option value="2">2 Days Before Due Date</option>
                        <option value="Disabled">Disabled / Manual Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Maturity Reminder Timing</label>
                      <select
                        name="maturityReminderDays"
                        value={formData.maturityReminderDays}
                        onChange={handleChange}
                        className="w-full border-slate-100 rounded-lg text-sm outline-none p-2.5 bg-slate-50 focus:bg-white focus:border-[#4F46E5] border"
                      >
                        <option value="3">3 Days Before Plan Expiry</option>
                        <option value="7">7 Days Before Plan Expiry</option>
                        <option value="15">15 Days Before Plan Expiry</option>
                        <option value="Disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SECURITY AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Administrative Audit Log</h2>
                    <p className="text-xs text-slate-500">Live immutable chronological ledger of system actions and modifications.</p>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">
                    Tracked in LocalStorage
                  </span>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                  <div className="overflow-y-auto max-h-[360px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white border-b border-slate-100 text-slate-400 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3">Timestamp</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {auditLogs && auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 whitespace-nowrap text-slate-500 text-[10px] font-mono">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-4 py-2.5 whitespace-nowrap font-bold text-slate-700">
                                {log.action}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500 leading-relaxed max-w-xs sm:max-w-md truncate md:whitespace-normal">
                                {log.details}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                              No security log entries registered yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {activeTab !== "audit" && (
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                type="button"
                className="px-6 py-2 bg-gradient-to-r from-[#4F46E5] to-[#312e81] border border-transparent rounded-lg text-sm font-semibold text-white hover:from-[#4338ca] hover:to-[#3730a3] transition-colors shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
