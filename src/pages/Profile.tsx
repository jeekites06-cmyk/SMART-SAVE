import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Lock,
  Key,
  Camera,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Profile() {
  const { user, login } = useAuth();
  const {
    settings,
    employees,
    members,
    updateEmployee,
    updateMember,
    updateSettings,
    logAudit,
  } = useData();

  const [activeTab, setActiveTab] = useState<"personal" | "security">(
    "personal",
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const loggedInEmployee = React.useMemo(() => {
    if (user?.role === "Employee")
      return employees.find((emp) => emp.username === user.username);
    return null;
  }, [user, employees]);

  const loggedInMember = React.useMemo(() => {
    if (user?.role === "Member")
      return members.find(
        (m) => m.id === user.memberId || m.name === user.username,
      );
    return null;
  }, [user, members]);

  const resolvedUserPhoto = React.useMemo(() => {
    if (user?.photo) return user.photo;
    if (user?.role === "Employee") return loggedInEmployee?.photo;
    if (user?.role === "Member") return loggedInMember?.photo;
    return settings?.adminPhoto;
  }, [user, loggedInEmployee, loggedInMember, settings]);

  const joinedDate = React.useMemo(() => {
    if (user?.role === "Employee") return loggedInEmployee?.dateJoined || "N/A";
    if (user?.role === "Member") return loggedInMember?.joinDate || "N/A";
    return "N/A (Admin)";
  }, [user, loggedInEmployee, loggedInMember]);

  const displayId = React.useMemo(() => {
    if (user?.role === "Employee") return loggedInEmployee?.id || "N/A";
    if (user?.role === "Member") return loggedInMember?.id || "N/A";
    return "ADMIN-01";
  }, [user, loggedInEmployee, loggedInMember]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "Employee" && loggedInEmployee) {
      setContactName(loggedInEmployee.name || "");
      setContactPhone(loggedInEmployee.phone || "");
      setContactEmail(loggedInEmployee.email || "");
    } else if (user.role === "Member" && loggedInMember) {
      setContactName(loggedInMember.name || "");
      setContactPhone(loggedInMember.phone || "");
      setContactEmail((loggedInMember as any).email || "");
    } else {
      setContactName(settings?.adminName || user.username || "");
      setContactPhone(settings?.adminPhone || "");
      setContactEmail(settings?.adminEmail || "");
    }
  }, [loggedInEmployee, loggedInMember, settings, user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
      setPhoneError("Valid 10-digit mobile number required.");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email) return true; // Optional email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Invalid email format.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const isPhoneValid = validatePhone(contactPhone);
    const isEmailValid = validateEmail(contactEmail);

    if (!isPhoneValid || !isEmailValid) return;

    if (user.role === "Employee" && loggedInEmployee) {
      updateEmployee(loggedInEmployee.id, {
        phone: contactPhone,
        email: contactEmail,
        photo: tempPhoto || resolvedUserPhoto,
      });
      logAudit(
        "Profile Update",
        `Employee ${loggedInEmployee.username} updated profile`,
      );
    } else if (user.role === "Member" && loggedInMember) {
      updateMember(loggedInMember.id, {
        phone: contactPhone,
        email: contactEmail,
        photo: tempPhoto || resolvedUserPhoto,
      } as any);
      logAudit("Profile Update", `Member ${user.username} updated profile`);
    } else {
      updateSettings({
        ...settings,
        adminPhone: contactPhone,
        adminEmail: contactEmail,
        adminPhoto: tempPhoto || resolvedUserPhoto,
      });
      logAudit("Profile Update", `Admin updated profile`);
    }

    if (tempPhoto) {
      login({ ...user, photo: tempPhoto });
      setTempPhoto(null);
    }

    // Save to local storage for demo mode
    localStorage.setItem(
      "demo_profile_data",
      JSON.stringify({ phone: contactPhone, email: contactEmail }),
    );

    showSuccess("Profile updated successfully.");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (user.role === "Super Admin" || user.role === "Administrator") {
      const actualCurrent = settings?.adminPassword || "Ani@2024";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateSettings({ ...settings, adminPassword: newPassword });
      logAudit("Password Change", `Super Admin changed their password`);
    } else if (user.role === "Employee") {
      if (!loggedInEmployee) return;
      const actualCurrent = loggedInEmployee.password || "emp123";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateEmployee(loggedInEmployee.id, { password: newPassword });
      logAudit(
        "Password Change",
        `Employee ${loggedInEmployee.username} changed password`,
      );
    } else if (user.role === "Member") {
      if (!loggedInMember) return;
      const actualCurrent = loggedInMember.password || "123456";
      if (currentPassword !== actualCurrent) {
        setPasswordError("Incorrect current password.");
        return;
      }
      updateMember(loggedInMember.id, { password: newPassword } as any);
      logAudit("Password Change", `Member ${user.username} changed password`);
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showSuccess("Profile updated successfully.");
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <UserIcon className="w-6 h-6" />
          </div>
          My Profile
        </h2>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("personal")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "personal"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Personal Information
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === "security"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-4 h-4" /> Security Settings
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === "personal" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full border-4 border-slate-50 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
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
                      <span className="text-4xl font-extrabold text-blue-600 uppercase">
                        {user.username.charAt(0)}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg border-2 border-white">
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
                          setPhotoError(null);
                          const reader = new FileReader();
                          reader.onloadend = () =>
                            setTempPhoto(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h3 className="text-2xl font-bold text-slate-800">
                    {contactName}
                  </h3>
                  <p className="text-slate-500 font-medium">@{user.username}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      {user.role}
                    </span>
                    <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                      <Shield className="w-3.5 h-3.5 mr-1" /> ID: {displayId}
                    </span>
                    <span className="flex items-center text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> Joined{" "}
                      {joinedDate}
                    </span>
                  </div>
                  {photoError && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      {photoError}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        disabled
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium focus:outline-none"
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Contact administrator to change your name.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Username / Login ID
                      </label>
                      <input
                        type="text"
                        value={user.username}
                        disabled
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" /> Mobile
                        Number
                      </label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => {
                          setContactPhone(e.target.value);
                          if (phoneError) setPhoneError("");
                        }}
                        className={`w-full p-3 border rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${phoneError ? "border-red-300" : "border-slate-200"}`}
                      />
                      {phoneError && (
                        <p className="text-xs text-red-600 mt-1.5 font-medium">
                          {phoneError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" /> Email
                        Address
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => {
                          setContactEmail(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        className={`w-full p-3 border rounded-xl bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-shadow ${emailError ? "border-red-300" : "border-slate-200"}`}
                      />
                      {emailError && (
                        <p className="text-xs text-red-600 mt-1.5 font-medium">
                          {emailError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Change Password
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Ensure your account is using a long, random password to stay
                  secure.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-start gap-2 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{passwordError}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 p-3 border border-slate-200 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
