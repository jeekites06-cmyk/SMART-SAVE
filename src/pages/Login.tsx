import React, { useState, useEffect } from "react";
import {
  Wallet,
  Lock,
  User,
  ArrowRight,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const {
    members,
    settings,
    employees,
    markAttendance,
    addLoginHistory,
    updateEmployee,
    updateMember,
    logAudit,
  } = useData();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState<"staff" | "member">("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("smartsave_remember_me_username");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSendOTP = () => {
    setError("");
    const cleanInputPhone = username.replace(/[\s\-\(\)]/g, "");
    if (!cleanInputPhone) {
      setError("Please enter a valid mobile number.");
      return;
    }

    const member = members.find((m) => {
      const cleanMemberPhone = (m.phone || "").replace(/[\s\-\(\)]/g, "");
      return (
        cleanMemberPhone === cleanInputPhone ||
        (cleanInputPhone.length >= 10 &&
          cleanMemberPhone.endsWith(cleanInputPhone.slice(-10)))
      );
    });

    if (!member) {
      setError("Mobile number not registered.");
      return;
    }

    if (member.accountStatus === "Disabled") {
      setError("Your account is disabled. Please contact administrator.");
      return;
    }
    if (
      member.accountStatus === "Locked" &&
      member.lockUntil &&
      Date.now() < member.lockUntil
    ) {
      setError("Too many failed login attempts. Please try again later.");
      return;
    } else if (
      member.accountStatus === "Locked" &&
      member.lockUntil &&
      Date.now() >= member.lockUntil
    ) {
      updateMember(member.id, {
        accountStatus: "Active",
        failedLoginAttempts: 0,
        lockUntil: 0,
      });
    }

    if (member.status === "Inactive" && member.accountStatus !== "Locked") {
      setError("Your account is inactive. Please contact administrator.");
      return;
    }

    const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("member_demo_otp", demoOtp);
    localStorage.setItem(
      "member_demo_otp_expiry",
      (Date.now() + 5 * 60 * 1000).toString()
    );

    console.log(`DEMO OTP for ${username}:`, demoOtp);
    try {
      alert(`DEMO OTP: ${demoOtp}`);
    } catch (e) {
      console.warn("Alert blocked. OTP is in console.");
    }

    setOtpStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const maxAttempts = settings?.maxFailedLoginAttempts || 5;
    const lockDuration = 15 * 60 * 1000; // 15 minutes

    if (loginType === "staff") {
      const configuredAdminUsername = settings?.adminUsername || "smartadmin";
      const configuredAdminPassword = settings?.adminPassword || "Ani@2024";

      if (username.toLowerCase() === configuredAdminUsername.toLowerCase()) {
        if (password === configuredAdminPassword) {
          if (rememberMe) {
            localStorage.setItem("smartsave_remember_me_username", username);
          } else {
            localStorage.removeItem("smartsave_remember_me_username");
          }
          logAudit("Login", `Super Admin logged in successfully`);
          addLoginHistory({
            username: "Admin",
            role: "Super Admin",
            loginTime: new Date().toISOString(),
            status: "Successful",
          });
          login({ username: "Admin", role: "Super Admin" });
        } else {
          logAudit("Failed Login", `Failed login attempt for Super Admin`);
          addLoginHistory({
            username: "Admin",
            role: "Super Admin",
            loginTime: new Date().toISOString(),
            status: "Failed",
          });
          setError("Invalid username or password");
        }
        return;
      }

      const matchedEmployee = employees.find(
        (emp) => emp.username.toLowerCase() === username.toLowerCase(),
      );
      if (matchedEmployee) {
        if (matchedEmployee.accountStatus === "Disabled") {
          setError("Your account is disabled. Please contact administrator.");
          return;
        }
        if (
          matchedEmployee.accountStatus === "Locked" &&
          matchedEmployee.lockUntil &&
          Date.now() < matchedEmployee.lockUntil
        ) {
          setError("Too many failed login attempts. Please try again later.");
          return;
        } else if (
          matchedEmployee.accountStatus === "Locked" &&
          matchedEmployee.lockUntil &&
          Date.now() >= matchedEmployee.lockUntil
        ) {
          // Auto-unlock after time expires
          updateEmployee(matchedEmployee.id, {
            accountStatus: "Active",
            failedLoginAttempts: 0,
            lockUntil: 0,
          });
        }

        if (
          matchedEmployee.status === "Inactive" &&
          matchedEmployee.accountStatus !== "Locked"
        ) {
          setError("Your account is inactive. Please contact administrator.");
          return;
        }

        if (matchedEmployee.password === password) {
          // Success
          updateEmployee(matchedEmployee.id, {
            failedLoginAttempts: 0,
            lockUntil: 0,
            accountStatus:
              matchedEmployee.accountStatus === "Locked"
                ? "Active"
                : matchedEmployee.accountStatus,
          });
          addLoginHistory({
            employeeId: matchedEmployee.id,
            username: matchedEmployee.name,
            role: "Employee",
            loginTime: new Date().toISOString(),
            status: "Successful",
          });
          markAttendance(matchedEmployee.id, "Present");

          if (rememberMe) {
            localStorage.setItem("smartsave_remember_me_username", username);
          } else {
            localStorage.removeItem("smartsave_remember_me_username");
          }
          logAudit(
            "Login",
            `Employee ${matchedEmployee.username} logged in successfully`,
          );
          login({
            username: matchedEmployee.name,
            role: "Employee",
            name: matchedEmployee.name,
            memberId: matchedEmployee.id,
          });
        } else {
          // Failed
          const attempts = (matchedEmployee.failedLoginAttempts || 0) + 1;
          logAudit(
            "Failed Login",
            `Failed login attempt for Employee ${username}`,
          );
          addLoginHistory({
            employeeId: matchedEmployee.id,
            username: matchedEmployee.name,
            role: "Employee",
            loginTime: new Date().toISOString(),
            status: "Failed",
          });
          if (attempts >= maxAttempts) {
            updateEmployee(matchedEmployee.id, {
              failedLoginAttempts: attempts,
              accountStatus: "Locked",
              lockUntil: Date.now() + lockDuration,
            });
            setError("Too many failed login attempts. Please try again later.");
          } else {
            updateEmployee(matchedEmployee.id, {
              failedLoginAttempts: attempts,
            });
            setError("Invalid username or password");
          }
        }
      } else {
        setError("Invalid username or password");
      }
    } else {
      // Member login
      if (otpStep === 1) {
        handleSendOTP();
        return;
      }
      
      const cleanInputPhone = username.replace(/[\s\-\(\)]/g, "");
      const member = members.find((m) => {
        const cleanMemberPhone = (m.phone || "").replace(/[\s\-\(\)]/g, "");
        return (
          cleanMemberPhone === cleanInputPhone ||
          (cleanInputPhone.length >= 10 &&
            cleanMemberPhone.endsWith(cleanInputPhone.slice(-10)))
        );
      });

      if (!member) {
        setError("Mobile number not registered.");
        return;
      }

      const storedOtp = localStorage.getItem("member_demo_otp");
      const expiry = localStorage.getItem("member_demo_otp_expiry");

      if (!storedOtp || !expiry) {
        setError("OTP expired or not requested.");
        return;
      }

      if (Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem("member_demo_otp");
        localStorage.removeItem("member_demo_otp_expiry");
        setError("OTP has expired. Please resend OTP.");
        return;
      }

      if (storedOtp === otp) {
        // Success
        localStorage.removeItem("member_demo_otp");
        localStorage.removeItem("member_demo_otp_expiry");
        
        updateMember(member.id, {
          failedLoginAttempts: 0,
          lockUntil: 0,
          accountStatus:
            member.accountStatus === "Locked"
              ? "Active"
              : member.accountStatus,
        });
        if (rememberMe) {
          localStorage.setItem("smartsave_remember_me_username", username);
        } else {
          localStorage.removeItem("smartsave_remember_me_username");
        }
        logAudit(
          "Login",
          `Member ${member.name} logged in successfully via OTP`,
        );
        addLoginHistory({
          employeeId: member.id,
          username: member.name,
          role: "Member",
          loginTime: new Date().toISOString(),
          status: "Successful",
        });
        login({
          username: member.name,
          role: "Member",
          name: member.name,
          memberId: member.id,
        });
      } else {
        // Failed
        const attempts = (member.failedLoginAttempts || 0) + 1;
        logAudit(
          "Failed Login",
          `Failed OTP login attempt for Member ${username}`,
        );
        addLoginHistory({
          employeeId: member.id,
          username: member.name,
          role: "Member",
          loginTime: new Date().toISOString(),
          status: "Failed",
        });
        if (attempts >= maxAttempts) {
          updateMember(member.id, {
            failedLoginAttempts: attempts,
            accountStatus: "Locked",
            lockUntil: Date.now() + lockDuration,
          });
          setError(
            "Too many failed login attempts. Please try again later.",
          );
          setOtpStep(1);
          setOtp("");
        } else {
          updateMember(member.id, { failedLoginAttempts: attempts });
          setError("Invalid OTP.");
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2929&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-blue-900/80 mix-blend-multiply"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-1.5 shrink-0">
            {settings?.companyLogo ? (
              <img
                src={settings.companyLogo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Wallet className="w-10 h-10 text-[#003366]" />
            )}
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight break-all">
            {settings?.companyName || "SMART SAVE"}
          </h2>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginType("staff");
                setError("");
                setUsername("");
                setPassword("");
                setOtpStep(1);
                setOtp("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "staff" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginType("member");
                setError("");
                setUsername("");
                setPassword("");
                setOtpStep(1);
                setOtp("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "member" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Member Login
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-800 text-center">
              {loginType === "staff"
                ? "Staff Portal Login"
                : "Member Portal Login"}
            </h3>
            <p className="text-sm text-slate-500 text-center mt-1">
              {loginType === "staff"
                ? "Sign in to access staff dashboard"
                : "Sign in to view your profile"}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700"
              >
                {loginType === "staff" ? "Username" : "Mobile Number"}
              </label>
              <div className="mt-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 rounded-md shadow-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loginType === "staff" ? (
                      <User className="h-5 w-5 text-slate-400" />
                    ) : (
                      <Phone className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    id="username"
                    name="username"
                    type={loginType === "staff" ? "text" : "tel"}
                    required
                    readOnly={loginType === "member" && otpStep === 2}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border outline-none transition-colors ${loginType === "member" && otpStep === 2 ? "bg-slate-200 cursor-not-allowed" : "bg-slate-50"}`}
                    placeholder={
                      loginType === "staff"
                        ? "Enter your username"
                        : "Enter mobile number"
                    }
                  />
                </div>
                {loginType === "member" && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors whitespace-nowrap"
                  >
                    {otpStep === 1 ? "Send OTP" : "Resend OTP"}
                  </button>
                )}
              </div>
            </div>

            {loginType === "staff" && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
            )}

            {loginType === "member" && otpStep === 2 && (
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-slate-700"
                >
                  Enter 6-digit OTP
                </label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#003366] focus:ring-[#003366] border-slate-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-slate-700 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
            </div>

            {!(loginType === "member" && otpStep === 1) && (
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors group"
                >
                  {loginType === "staff" ? "Sign In" : "Verify & Sign In"}
                  <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="font-medium text-[#003366] hover:text-[#004080] bg-transparent border-none p-0 cursor-pointer text-sm"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-blue-100">
            &copy; {new Date().getFullYear()} Smart Save Financial Systems. All
            rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
