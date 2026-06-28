import React, { useState } from "react";
import { Wallet, Mail, ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { settings } = useData();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
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
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-slate-800 text-center">
              Forgot Password
            </h3>
            <p className="text-sm text-slate-500 text-center mt-1">
              Enter your registered email address to receive recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="space-y-6 text-center">
              <div className="bg-green-50 text-green-700 text-sm p-4 rounded-lg border border-green-100">
                Password recovery instructions have been sent to <strong>{email}</strong> if it exists in our system.
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
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:ring-[#003366] focus:border-[#003366] block w-full pl-10 sm:text-sm border-slate-300 rounded-lg py-3 border bg-slate-50 outline-none transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#003366] hover:bg-[#004080] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003366] transition-colors group"
                >
                  Send Recovery Link
                  <Send className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-all" />
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex items-center text-sm font-medium text-[#003366] hover:text-[#004080] bg-transparent border-none p-0 cursor-pointer"
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to Sign In
                </button>
              </div>
            </form>
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
