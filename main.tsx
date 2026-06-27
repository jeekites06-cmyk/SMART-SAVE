import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Member, Collection } from "./types.ts";

// Migration: Perform a total clean reset to a fresh installation state with no member data
try {
  const isResetDone = localStorage.getItem("smartsave_clean_reset_done_v2") === "true";
  if (!isResetDone) {
    localStorage.removeItem("smartsave_members");
    localStorage.removeItem("smartsave_collections");
    localStorage.removeItem("smartsave_commission_payments");
    localStorage.removeItem("smartsave_auditlogs");
    localStorage.setItem("smartsave_clean_reset_done_v2", "true");
  }
} catch (e) {
  console.error("Failed to execute clean reset", e);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
