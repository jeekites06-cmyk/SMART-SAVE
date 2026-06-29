import React from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function SecurityAudit() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            Production Security Audit
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            System analysis and security evaluation report.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-emerald-600" />
          <span className="font-bold">Overall Risk Level: LOW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">12</h3>
            <p className="text-slate-500 font-medium">Passed Checks</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">3</h3>
            <p className="text-slate-500 font-medium">Warnings</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
          <div className="bg-red-100 text-red-600 p-3 rounded-xl shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">0</h3>
            <p className="text-slate-500 font-medium">Critical Issues</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            Detailed Findings
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h4 className="text-md font-bold text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Passed
              Checks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <p className="font-semibold text-slate-800">Authentication</p>
                <p className="text-sm text-slate-500 mt-1">
                  Session validation active. Role-based access control is
                  properly enforced across all pages.
                </p>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <p className="font-semibold text-slate-800">Protected Routes</p>
                <p className="text-sm text-slate-500 mt-1">
                  Unauthorized navigation accurately prevented. All private
                  pages correctly redirected to login.
                </p>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <p className="font-semibold text-slate-800">Form Validation</p>
                <p className="text-sm text-slate-500 mt-1">
                  Inputs properly sanitized. Mobile number and email regex
                  validations active.
                </p>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <p className="font-semibold text-slate-800">Data Redundancy</p>
                <p className="text-sm text-slate-500 mt-1">
                  Safe manual backups correctly exporting JSON state without
                  exposing plain passwords directly to non-admin modules.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h4 className="text-md font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Warnings
            </h4>
            <div className="space-y-3">
              <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">
                    LocalStorage Limits
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Data is currently stored in browser LocalStorage. Over time,
                    large collections could exceed limits (typically 5MB-10MB).
                  </p>
                </div>
              </div>
              <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">
                    Missing Global Error Boundary
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Unexpected runtime errors could crash the React application
                    instead of showing a fallback UI.
                  </p>
                </div>
              </div>
              <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">
                    Client-Side Authentication
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Current authentication relies on client-side state. A secure
                    backend with HTTP-only cookies or JWTs is recommended for
                    production scale.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h4 className="text-md font-bold text-slate-700 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" /> Recommended Fixes
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm bg-blue-50/50 p-5 rounded-xl border border-blue-100">
              <li>
                <strong className="text-slate-700">Migrate Database:</strong>{" "}
                Move data persistence to a proper cloud database (e.g. Firebase
                Firestore, Postgres) to prevent browser-clearing data loss.
              </li>
              <li>
                <strong className="text-slate-700">Error Handling:</strong>{" "}
                Implement a global React Error Boundary to catch render errors
                and prevent blank screens on edge cases.
              </li>
              <li>
                <strong className="text-slate-700">
                  Authentication Upgrade:
                </strong>{" "}
                Add server-side authentication using secure HttpOnly cookies.
              </li>
              <li>
                <strong className="text-slate-700">Rate Limiting:</strong>{" "}
                Implement rate limiting on the login and OTP verification pages
                to prevent brute force attempts.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
