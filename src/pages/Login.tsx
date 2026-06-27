import React, { useState, useEffect } from "react";
import { Wallet, Lock, User, ArrowRight, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const { members, settings, employees, markAttendance, addLoginHistory } = useData();
  const navigate = useNavigate();
  
  const [loginType, setLoginType] = useState<"staff" | "member">("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("smartsave_remember_me_username");
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginType === "staff") {
      const configuredAdminUsername = settings?.adminUsername || "smartadmin";
      const configuredAdminPassword = settings?.adminPassword || "Admin@2026";
      if (username.toLowerCase() === configuredAdminUsername.toLowerCase() && password === configuredAdminPassword) {
        if (rememberMe) {
          localStorage.setItem("smartsave_remember_me_username", username);
        } else {
          localStorage.removeItem("smartsave_remember_me_username");
        }
        login({ username: "Admin", role: "Super Admin" });
      } else {
        const matchedEmployee = employees.find(
          (emp) => emp.username.toLowerCase() === username.toLowerCase() && emp.password === password
        );
        if (matchedEmployee) {
          if (matchedEmployee.status === "Inactive") {
            setError("Your account is inactive. Please contact administrator.");
            return;
          }
          // Log history and mark attendance
          addLoginHistory(matchedEmployee.id);
          markAttendance(matchedEmployee.id, "Present");
          
          if (rememberMe) {
            localStorage.setItem("smartsave_remember_me_username", username);
          } else {
            localStorage.removeItem("smartsave_remember_me_username");
          }
          login({
            username: matchedEmployee.name,
            role: "Employee",
            name: matchedEmployee.name,
            memberId: matchedEmployee.id,
          });
        } else {
          setError("Invalid username or password");
        }
      }
    } else {
      // Member login
      const member = members.find(m => m.phone === username);
      if (member && password === "123456") {
        if (rememberMe) {
          localStorage.setItem("smartsave_remember_me_username", username);
        } else {
          localStorage.removeItem("smartsave_remember_me_username");
        }
        login({ username: member.name, role: "Member", name: member.name, memberId: member.id });
      } else {
        setError("Invalid mobile number or password (hint: pwd is 123456)");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2929&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-blue-900/80 mix-blend-multiply"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <Wallet className="w-10 h-10 text-[#003366]" />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            SMART SAVE
          </h2>
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100">
          
          <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => { setLoginType("staff"); setError(""); setUsername(""); setPassword(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "staff" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginType("member"); setError(""); setUsername(""); setPassword(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginType === "member" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
            >
              Member Login
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-800 text-center">
              {loginType === "staff" ? "Staff Portal Login" : "Member Portal Login"}
            </h3>
            <p className="text-sm text-slate-500 text-center mt-1">
              {loginType === "staff" ? "Sign in to access staff dashboard" : "Sign in to view your profile"}
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
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {loginType === "staff" ? <User className="h-5 w-5 text-slate-400" /> : <Phone className="h-5 w-5 text-slate-400" />}
                </div>
                <input
                  id="username"
                  name="username"
                  type={loginType === "staff" ? "text" : "tel"}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                  placeholder={loginType === "staff" ? "Enter your username" : "Enter mobile number"}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
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
                  placeholder={loginType === "member" ? "Default password is 123456" : "Enter your password"}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
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

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-medium text-[#003366] hover:text-[#004080] bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors group"
              >
                Sign In
                <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
            
            {loginType === "staff" && (
              <div className="mt-4 text-xs text-slate-500 text-center flex flex-col gap-1">
                <p>Admin: {settings?.adminUsername || "smartadmin"} / {settings?.adminPassword || "Admin@2026"}</p>
                <p>Employee: employee / emp123 (or check Employee Management)</p>
              </div>
            )}
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
