import React, { useState, useEffect } from "react";
import { Wallet, Phone, ArrowLeft, ArrowRight, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { settings, employees, members, updateEmployee, updateMember, updateSettings, logAudit } = useData();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  
  // User info
  const [userType, setUserType] = useState<"admin" | "employee" | "member" | null>(null);
  const [userId, setUserId] = useState<string>("");
  
  // OTP state
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number>(0);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Password Reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes
    setOtpAttempts(0);
    setTimeLeft(60);
    
    // Simulate OTP locally using browser localStorage
    localStorage.setItem('simulated_otp', otp);
    
    // Display the generated OTP in the browser console only
    console.log(`[DEVELOPMENT] Simulated OTP for ${mobile}:`, otp);
    try {
      alert(`DEMO OTP: ${otp}`);
    } catch (e) {
      console.warn("Alert blocked. OTP is in console.");
    }
    
    // Production Ready: SMS API integration would go here
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Check Super Admin
    if (mobile === "0000000000" || mobile.toLowerCase() === "smartadmin") {
      setUserType("admin");
      setUserId("admin");
      generateOTP();
      setStep(2);
      return;
    }
    
    // Check Employees
    const emp = employees.find(e => e.phone === mobile || e.username.toLowerCase() === mobile.toLowerCase());
    if (emp) {
      if (emp.designation === "Super Admin" || emp.username.toLowerCase() === "smartadmin") {
         setUserType("admin");
      } else {
         setUserType("employee");
      }
      setUserId(emp.id);
      generateOTP();
      setStep(2);
      return;
    }
    
    // Check Members
    const member = members.find(m => m.phone === mobile);
    if (member) {
      setUserType("member");
      setUserId(member.id);
      generateOTP();
      setStep(2);
      return;
    }
    
    setError("Mobile number not registered.");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (Date.now() > otpExpiry) {
      setError("OTP has expired. Please resend.");
      return;
    }
    
    if (otpAttempts >= 5) {
      setError("Maximum attempts reached. Please resend OTP.");
      return;
    }
    
    if (otpInput === generatedOtp) {
      setGeneratedOtp(""); // Clear OTP
      localStorage.removeItem('simulated_otp');
      logAudit("OTP Verification", `Successful OTP verification for mobile: ${mobile}`);
      setStep(3);
    } else {
      setOtpAttempts(prev => prev + 1);
      logAudit("Failed OTP Attempt", `Failed OTP attempt for mobile: ${mobile}`);
      setError("Invalid OTP");
    }
  };

  const validatePassword = (pass: string) => {
    const minLength = /.{8,}/;
    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasNumber = /[0-9]/;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    
    if (!minLength.test(pass)) return "Minimum 8 Characters";
    if (!hasUpper.test(pass)) return "At least one uppercase letter";
    if (!hasLower.test(pass)) return "At least one lowercase letter";
    if (!hasNumber.test(pass)) return "At least one number";
    if (!hasSpecial.test(pass)) return "At least one special character";
    
    return "";
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    const passError = validatePassword(newPassword);
    if (passError) {
      setError(passError);
      return;
    }
    
    if (userType === "admin") {
      updateSettings({ adminPassword: newPassword });
      if (userId !== "admin") {
         updateEmployee(userId, { password: newPassword });
      } else {
         const adminEmp = employees.find(e => e.designation === "Super Admin" || e.username === "smartadmin");
         if (adminEmp) {
            updateEmployee(adminEmp.id, { password: newPassword });
         }
      }
    } else if (userType === "employee") {
      updateEmployee(userId, { password: newPassword });
    } else if (userType === "member") {
      updateMember(userId, { password: newPassword } as any);
    }
    
    logAudit("Password Reset", `Password reset successfully for ${userType} (${mobile})`);
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2929&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat relative">
      <div className="absolute inset-0 bg-blue-900/80 mix-blend-multiply"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-1.5 shrink-0">
            {settings?.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
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
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100 relative overflow-hidden">
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-800 text-center">
              Forgot Password
            </h3>
            <p className="text-sm text-slate-500 text-center mt-1">
              {step === 1 && "Enter your registered mobile number."}
              {step === 2 && "Enter the 6-digit OTP sent to your mobile."}
              {step === 3 && "Create a new strong password."}
              {step === 4 && "Success!"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <form className="space-y-6" onSubmit={handleMobileSubmit}>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-slate-700">
                  Registered Mobile Number
                </label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="mobile"
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors group"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5 opacity-70 group-hover:opacity-100 transition-all" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                  Enter OTP
                </label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors tracking-widest font-mono text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : ""}
                </span>
                <button
                  type="button"
                  disabled={timeLeft > 0}
                  onClick={generateOTP}
                  className={`font-medium ${timeLeft > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#003366] hover:text-[#004080]"}`}
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none transition-colors group"
              >
                Verify OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pr-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1 relative rounded-md shadow-lg">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pr-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none transition-colors"
              >
                Reset Password
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="bg-emerald-50 text-emerald-700 text-sm p-4 rounded-lg border border-emerald-100 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                <span className="font-medium text-lg">Password reset successfully.</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </button>
            </div>
          )}

          {step < 4 && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center text-sm font-medium text-[#003366] hover:text-[#004080] bg-transparent border-none p-0 cursor-pointer"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Sign In
              </button>
            </div>
          )}
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
