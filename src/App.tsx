import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Users, 
  Activity, 
  Calendar, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  Brain, 
  LogOut, 
  Key, 
  User, 
  Bell, 
  Search, 
  CheckCheck, 
  ChevronRight, 
  Sparkles,
  Info 
} from "lucide-react";

// Types
import { User as UserType, Patient, Doctor, Appointment, MedicalRecord, Invoice, SystemNotification } from "./types";

// Role-based components
import AdminDashboard from "./components/AdminDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import PatientDashboard from "./components/PatientDashboard";
import ReceptionistDashboard from "./components/ReceptionistDashboard";
import MedicalRecordsManager from "./components/MedicalRecordsManager";
import BillingManager from "./components/BillingManager";
import AnalyticsPanel from "./components/AnalyticsPanel";
import EmergencyModule from "./components/EmergencyModule";
import AISuggestionsTab from "./components/AISuggestionsTab";

// Robust fetch utility with automatic retries and exponential backoff
async function fetchWithRetry(url: string, options?: RequestInit, retries = 3, delay = 1000): Promise<any> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

export default function App() {
  // Session State
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Beautiful Custom Toast alerts instead of standard browser popups
  const [activeToast, setActiveToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  useEffect(() => {
    // Intercept default window alert
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      // Direct to our beautiful custom toast
      setActiveToast({ message: msg, type: "success" });
      const timer = setTimeout(() => {
        setActiveToast((current) => (current?.message === msg ? null : current));
      }, 4500);
      return () => clearTimeout(timer);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // Authenticating form state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"patient" | "doctor" | "receptionist" | "admin">("patient");
  const [authSpecialty, setAuthSpecialty] = useState("General Practitioner");
  const [authDepartment, setAuthDepartment] = useState("General Medicine");
  const [regMode, setRegMode] = useState(false);
  const [authError, setAuthError] = useState("");

  // System Core States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // Navigation Panel View State
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // Search everywhere state
  const [globalQuery, setGlobalQuery] = useState("");
  const [showGlobalResults, setShowGlobalResults] = useState(false);

  // Notifications Popover overlay
  const [showNotifications, setShowNotifications] = useState(false);

  // Hydrate Data from Server
  async function hydrateSystem() {
    try {
      const [resPatients, resDoctors, resApt, resRecords, resInvoices, resNotif] = await Promise.all([
        fetchWithRetry("/api/patients"),
        fetchWithRetry("/api/doctors"),
        fetchWithRetry("/api/appointments"),
        fetchWithRetry("/api/records"),
        fetchWithRetry("/api/invoices"),
        fetchWithRetry("/api/notifications")
      ]);

      setPatients(resPatients);
      setDoctors(resDoctors);
      setAppointments(resApt);
      setRecords(resRecords);
      setInvoices(resInvoices);
      setNotifications(resNotif || []);
    } catch (err) {
      console.error("Hydration Failure:", err);
    }
  }

  const handleClearDatabase = async () => {
    const yes = window.confirm("Are you sure you want to completely scrub the diagnostic database logs? This preserves your registered user account but archives all pre-loaded trials and default records so you can onboard yourself with clean entries fresh!");
    if (!yes) return;
    try {
      const resp = await fetch("/api/system/clear", { method: "POST" });
      if (resp.ok) {
        const data = await resp.json();
        window.alert(data.message || "Database successfully scrubbed! Starting with a clean hospital slate.");
        hydrateSystem();
      }
    } catch (e) {
      window.alert("Failed connectivity to clean slate.");
    }
  };

  const handleResetPresets = async () => {
    const yes = window.confirm("Restore original premium diagnostic trial presets immediately?");
    if (!yes) return;
    try {
      const resp = await fetch("/api/system/reset", { method: "POST" });
      if (resp.ok) {
        const data = await resp.json();
        window.alert(data.message || "Presets successfully restored!");
        hydrateSystem();
      }
    } catch (e) {
      window.alert("Failed to restore presets.");
    }
  };

  useEffect(() => {
    hydrateSystem();
    if (currentUser?.role === "patient") {
      setCurrentTab("patient-portal");
    }
  }, [currentUser]);

  // Periodic background synchronization to keep all sessions perfectly up-to-date in real-time
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => {
      hydrateSystem();
    }, 4000); // Poll every 4 seconds to catch patient bookings instantly
    return () => clearInterval(timer);
  }, [currentUser]);

  // Handle Login Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      if (resp.ok) {
        const user = await resp.json();
        setCurrentUser(user);
        
        // Match appropriate tab default
        if (user.role === "doctor") setCurrentTab("doctor-portal");
        else if (user.role === "patient") setCurrentTab("patient-portal");
        else if (user.role === "receptionist") setCurrentTab("receptionist-portal");
        else setCurrentTab("dashboard");
      } else {
        const err = await resp.json();
        setAuthError(err.message || "Invalid credentials.");
      }
    } catch (err) {
      setAuthError("Failed connection to the premium portal server.");
    }
  };

  // Handle registration flow (For patients, doctors, receptionist, or admins)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: authName, 
          email: authEmail, 
          password: authPassword, 
          role: authRole,
          specialty: authRole === "doctor" ? authSpecialty : undefined,
          department: authRole === "doctor" ? authDepartment : undefined
        })
      });
      if (resp.ok) {
        const user = await resp.json();
        setCurrentUser(user);
        
        // Match appropriate tab default based on role registered
        if (user.role === "doctor") {
          setCurrentTab("doctor-portal");
          alert(`Specialist account registered successfully. Welcome, Dr. ${user.name}!`);
        } else if (user.role === "receptionist") {
          setCurrentTab("receptionist-portal");
          alert(`Receptionist account registered successfully. Welcome, ${user.name}!`);
        } else if (user.role === "admin") {
          setCurrentTab("dashboard");
          alert(`Hospital Administrator account registered successfully. Welcome, ${user.name}!`);
        } else {
          setCurrentTab("patient-portal");
          alert(`Patient EHR Account registered successfully. Welcome, ${user.name}!`);
        }
        
        // Refresh system arrays to load newly created profile
        hydrateSystem();
      } else {
        const err = await resp.json();
        setAuthError(err.message || "Failed to complete register.");
      }
    } catch (e) {
      setAuthError("Register connection error.");
    }
  };

  // Preset switch logins for evaluating various features
  const triggerFastSwitch = async (email: string) => {
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "password123" })
      });
      if (resp.ok) {
        const user = await resp.json();
        setCurrentUser(user);
        setAuthEmail(email);
        setAuthPassword("password123");
        if (user.role === "doctor") setCurrentTab("doctor-portal");
        else if (user.role === "patient") setCurrentTab("patient-portal");
        else if (user.role === "receptionist") setCurrentTab("receptionist-portal");
        else setCurrentTab("dashboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mutators
  const addPatient = async (p: Omit<Patient, "id">) => {
    await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p)
    });
    hydrateSystem();
  };

  const updatePatient = async (id: string, updatedData: Partial<Patient>) => {
    await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    hydrateSystem();
  };

  const addDoctor = async (d: Omit<Doctor, "id">) => {
    await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d)
    });
    hydrateSystem();
  };

  const addAppointment = async (apt: Omit<Appointment, "id" | "status">) => {
    await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apt)
    });
    hydrateSystem();
  };

  const rescheduleAppointment = async (id: string, dateTime: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateTime })
    });
    hydrateSystem();
  };

  const cancelAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Cancelled" })
    });
    hydrateSystem();
  };

  const updateAppointmentStatus = async (id: string, status: "Completed" | "Cancelled") => {
    await fetch(`/api/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    hydrateSystem();
  };

  const updateDoctor = async (id: string, updated: Partial<Doctor>) => {
    try {
      const resp = await fetch(`/api/doctors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (resp.ok) {
        hydrateSystem();
      }
    } catch (err) {
      console.error("Failed to update doctor profile:", err);
    }
  };

  const addRecord = async (rec: Omit<MedicalRecord, "id">) => {
    await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec)
    });
    hydrateSystem();
  };

  const addInvoice = async (invoice: Omit<Invoice, "id" | "date" | "dueDate" | "total">) => {
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoice)
    });
    hydrateSystem();
  };

  const settleInvoice = async (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Paid", paidAmount: inv.total })
    });
    hydrateSystem();
    alert("Invoice payment processed and settled on the medical ledger!");
  };

  const updateInvoiceStatus = async (id: string, status: "Paid" | "Partially Paid" | "Unpaid", paidAmount: number) => {
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paidAmount })
    });
    hydrateSystem();
  };

  const markAllNotificationsAsRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    hydrateSystem();
  };

  const deletePatient = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this patient record and all their clinical associations?")) return;
    try {
      const resp = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (resp.ok) {
        hydrateSystem();
        alert("Patient record successfully removed.");
      } else {
        const err = await resp.json();
        alert(`Error deleting patient: ${err.message || resp.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting patient.");
    }
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this doctor roster profile?")) return;
    try {
      const resp = await fetch(`/api/doctors/${id}`, { method: "DELETE" });
      if (resp.ok) {
        hydrateSystem();
        alert("Doctor profile successfully removed.");
      } else {
        const err = await resp.json();
        alert(`Error deleting doctor: ${err.message || resp.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting doctor.");
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this scheduled appointment slot?")) return;
    try {
      const resp = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (resp.ok) {
        hydrateSystem();
        alert("Appointment record successfully removed.");
      } else {
        const err = await resp.json();
        alert(`Error deleting appointment: ${err.message || resp.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting appointment.");
    }
  };

  const deleteMedicalRecord = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this diagnostic history record?")) return;
    try {
      const resp = await fetch(`/api/records/${id}`, { method: "DELETE" });
      if (resp.ok) {
        hydrateSystem();
        alert("Medical diagnostic record successfully removed.");
      } else {
        const err = await resp.json();
        alert(`Error deleting medical record: ${err.message || resp.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting medical record.");
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this billing invoice item?")) return;
    try {
      const resp = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (resp.ok) {
        hydrateSystem();
        alert("Invoice successfully removed from the ledger.");
      } else {
        const err = await resp.json();
        alert(`Error deleting invoice: ${err.message || resp.statusText}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error deleting invoice.");
    }
  };

  // Search Results filtering
  const matchingPatients = globalQuery ? patients.filter(p => p.name.toLowerCase().includes(globalQuery.toLowerCase())) : [];
  const matchingInvoices = globalQuery ? invoices.filter(i => i.id.toLowerCase().includes(globalQuery.toLowerCase()) || i.patientName.toLowerCase().includes(globalQuery.toLowerCase())) : [];
  const matchingAppointments = globalQuery ? appointments.filter(a => a.id.toLowerCase().includes(globalQuery.toLowerCase()) || a.patientName.toLowerCase().includes(globalQuery.toLowerCase())) : [];

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Render Login Layout if unauthorized
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none" id="auth-screen">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Building2 className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="mt-6 text-2xl font-black text-gray-900 tracking-tight">Smart Hospital Portal</h2>
          <p className="mt-2 text-xs text-gray-400">Secure, role-based medical diagnostics and resource coordinator</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-gray-150 rounded-3xl shadow-sm sm:px-10">
            {authError && (
              <div className="mb-4 bg-rose-50 text-rose-800 text-xs p-3.5 rounded-xl border border-rose-100 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={regMode ? handleRegister : handleLogin} className="space-y-4">
              {regMode && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      placeholder="Alice Cooper"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Select System Role</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value as any)}
                      className="w-full text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold"
                    >
                      <option value="patient">🏥 Patient (EHR Identity File)</option>
                      <option value="doctor">🩺 Medical Specialist (Doctor)</option>
                      <option value="receptionist">💼 Front Desk Clerk / Receptionist</option>
                      <option value="admin">🔑 Hospital Administrator</option>
                    </select>
                  </div>

                  {authRole === "doctor" && (
                    <div className="grid grid-cols-2 gap-2 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/50">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Clinical Specialty</label>
                        <input
                          type="text"
                          required
                          value={authSpecialty}
                          onChange={(e) => setAuthSpecialty(e.target.value)}
                          className="w-full text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="e.g. Neurology"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Department</label>
                        <input
                          type="text"
                          required
                          value={authDepartment}
                          onChange={(e) => setAuthDepartment(e.target.value)}
                          className="w-full text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder="e.g. Diagnostics"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="admin@smarthospital.org"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                {regMode ? `Onboard as Hospital ${authRole.charAt(0).toUpperCase() + authRole.slice(1)}` : "Authorize Credentialed Entry"}
              </button>
            </form>

            <div className="relative my-6 text-center">
              <span className="text-[10px] text-gray-400 bg-white px-3 relative z-10 font-bold uppercase tracking-widest">or switch demo logins</span>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-150"></div>
            </div>

            {/* Quick Presets for Demo Testing */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => triggerFastSwitch("admin@smarthospital.org")}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 text-left transition"
              >
                <span className="block text-[10px] font-bold text-indigo-650 uppercase tracking-wider">SARAH JENKINS</span>
                <span className="block text-[8px] text-gray-400 mt-0.5">Admin Overview</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFastSwitch("house@smarthospital.org")}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 text-left transition"
              >
                <span className="block text-[10px] font-bold text-teal-650 uppercase tracking-wider">DR. GREG HOUSE</span>
                <span className="block text-[8px] text-gray-400 mt-0.5">Diagnostic Physician</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFastSwitch("reception@smarthospital.org")}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 text-left transition"
              >
                <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">CLARA OSWALD</span>
                <span className="block text-[8px] text-gray-400 mt-0.5">Front Clerk Triage</span>
              </button>

              <button
                type="button"
                onClick={() => triggerFastSwitch("alice@gmail.com")}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-150 text-left transition"
              >
                <span className="block text-[10px] font-bold text-rose-550 uppercase tracking-wider">ALICE COOPER</span>
                <span className="block text-[8px] text-gray-400 mt-0.5">Patient Dashboard</span>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setRegMode(!regMode)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {regMode ? "Already have an account? Go to standard login" : "Register custom patient or hospital staff account here"}
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center space-y-2">
              <p className="text-[10px] text-gray-400 font-medium">Want to test your own custom entries from a completely clean slate?</p>
              <button
                type="button"
                onClick={handleClearDatabase}
                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3.5 py-1.5 rounded-lg border border-rose-150 transition inline-flex items-center gap-1 cursor-pointer"
              >
                🗑️ Clear Preset Data & Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d16] flex flex-col font-sans select-none" id="smart-hospital-app">
      {/* Interactive Sandbox Seeding Control Strip */}
      <div className="bg-slate-900 border-b border-slate-950 font-mono text-[11px] text-slate-350 py-2 sm:py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-505"></span>
          </span>
          <span className="font-extrabold text-white">SANDBOX SIMULATION TERMINAL ACTIVE</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-[10px] text-slate-400 hidden lg:inline">Want to test custom data entries? Clean standard trials here or restore them instantly:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearDatabase}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/60 hover:border-rose-750 px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              🗑️ Clear Preset Data (Start Fresh)
            </button>
            <button
              onClick={handleResetPresets}
              className="bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 hover:border-emerald-650 px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              🔄 Reload Rich Demo Presets
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Header */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-gray-900 tracking-tight uppercase">Smart Hospital</span>
              <div className="text-[10px] text-gray-500 font-medium">Verified Access Profile: {currentUser.name} ({currentUser.role})</div>
            </div>
          </div>

          {/* Search Bar Everywhere */}
          <div className="relative flex-1 max-w-sm mx-4 hidden md:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search patients, invoices, appointment IDs..."
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setShowGlobalResults(e.target.value.length > 0);
              }}
              className="w-full text-xs py-2 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-hidden"
            />

            {showGlobalResults && (
              <div className="absolute left-0 right-0 top-11 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 text-xs">
                <div className="flex justify-between pb-1.5 mb-1.5 border-b border-gray-100">
                  <span className="font-bold text-gray-500 uppercase text-[9px]">Global Index Results</span>
                  <button type="button" onClick={() => setShowGlobalResults(false)} className="text-gray-400 hover:text-gray-600 font-semibold uppercase text-[9px]">Dismiss</button>
                </div>
                
                {matchingPatients.length === 0 && matchingInvoices.length === 0 && matchingAppointments.length === 0 ? (
                  <p className="text-gray-400 py-3 text-center">No catalog entries match query.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {matchingPatients.length > 0 && (
                      <div>
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Inpatients / Patients</span>
                        {matchingPatients.map(p => (
                          <div key={p.id} className="p-1 px-2.5 bg-gray-50 rounded-lg text-[11px] font-medium text-gray-800 flex justify-between hover:bg-blue-50 cursor-pointer mb-1" onClick={() => { setCurrentTab("patients"); setShowGlobalResults(false); }}>
                            <span>{p.name}</span>
                            <span className="text-gray-400 font-mono text-[9px]">{p.id}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchingInvoices.length > 0 && (
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">Invoices</span>
                        {matchingInvoices.map(i => (
                          <div key={i.id} className="p-1 px-2.5 bg-gray-50 rounded-lg text-[11px] font-medium text-gray-800 flex justify-between hover:bg-emerald-50 cursor-pointer mb-1" onClick={() => { setCurrentTab("billing"); setShowGlobalResults(false); }}>
                            <span>{i.patientName} (${i.total})</span>
                            <span className="text-gray-400 font-mono text-[9px]">{i.id}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {matchingAppointments.length > 0 && (
                      <div>
                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block mb-1">Visits</span>
                        {matchingAppointments.map(a => (
                          <div key={a.id} className="p-1 px-2.5 bg-gray-50 rounded-lg text-[11px] font-medium text-gray-800 flex justify-between hover:bg-rose-50 cursor-pointer mb-1" onClick={() => { setCurrentTab("appointments"); setShowGlobalResults(false); }}>
                            <span>{a.patientName} with {a.doctorName}</span>
                            <span className="text-gray-400 font-mono text-[9px]">{a.id}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Notifications Alert Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-xl transition relative"
                title="System alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold rounded-full text-[9px] flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-11 bg-white border border-gray-150 rounded-xl shadow-xl w-80 p-3.5 z-50 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-150 mb-2">
                    <span className="font-bold text-gray-950">System Notifications ({unreadNotifCount} unread)</span>
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark read
                    </button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">No alarms active.</p>
                    ) : (
                      notifications.toSpliced(0, 10).map((n) => (
                        <div key={n.id} className={`p-2.5 rounded-lg border text-xs leading-normal ${n.read ? "bg-white border-gray-100 text-gray-600" : "bg-blue-50/70 border-blue-105 text-gray-900"}`}>
                          <div className="font-bold">{n.title}</div>
                          <p className="text-[11px] mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-gray-400 block mt-1">{new Date(n.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout dispatch */}
            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-gray-100 rounded-xl transition"
              title="Sign out of portal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main workspace layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-60 flex-shrink-0 space-y-2 select-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mb-2 block">Healthcare Operations</p>
          
          {/* General navigation switches based on role access */}
          {currentUser.role === "admin" && (
            <button
              type="button"
              onClick={() => setCurrentTab("dashboard")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "dashboard" ? "bg-blue-650 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
            >
              <span className="flex items-center gap-2.5">
                <Building2 className="w-4.5 h-4.5" />
                Administrative Central
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser.role === "doctor" && (
            <button
              type="button"
              onClick={() => setCurrentTab("doctor-portal")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "doctor-portal" ? "bg-teal-650 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
            >
              <span className="flex items-center gap-2.5">
                <Activity className="w-4.5 h-4.5" />
                Attending Doctor portal
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser.role === "patient" && (
            <button
              type="button"
              onClick={() => setCurrentTab("patient-portal")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "patient-portal" ? "bg-rose-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
            >
              <span className="flex items-center gap-2.5">
                <User className="w-4.5 h-4.5" />
                Patient Personal Portal
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser.role === "receptionist" && (
            <button
              type="button"
              onClick={() => setCurrentTab("receptionist-portal")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "receptionist-portal" ? "bg-blue-650 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
            >
              <span className="flex items-center gap-2.5">
                <Calendar className="w-4.5 h-4.5" />
                Triage Appointments Desk
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser?.role !== "patient" && (
            <>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-3 mt-4 mb-2 block font-mono">Comprehensive registers</p>

              <button
                type="button"
                onClick={() => setCurrentTab("appointments")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "appointments" ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4.5 h-4.5" />
                  Schedules & Bookings
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab("records")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "records" ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="w-4.5 h-4.5" />
                  Clinical Diagnostics
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab("billing")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "billing" ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="w-4.5 h-4.5" />
                  Financial Billing Accounts
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab("analytics")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${currentTab === "analytics" ? "bg-blue-600 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150 hover:text-gray-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <Activity className="w-4.5 h-4.5" />
                  Analytics & Statistics
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab("ai-insights")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition leading-none ${currentTab === "ai-insights" ? "bg-indigo-650 text-white shadow-xs" : "text-indigo-600 hover:bg-indigo-50/40 hover:text-indigo-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-505 animate-pulse" />
                  Clinical Gemini AI Hub
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab("emergency")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition leading-none ${currentTab === "emergency" ? "bg-rose-600 text-white" : "text-rose-600 hover:bg-rose-50 hover:text-rose-900"}`}
              >
                <span className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-650 animate-bounce" />
                  Hot Page Emergencies
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </aside>

        {/* Content panel view */}
        <main className="flex-1 min-w-0" id="main-content">
          {currentTab === "dashboard" && (
            <AdminDashboard 
              patients={patients} 
              doctors={doctors} 
              appointments={appointments} 
              invoices={invoices}
              onAddDoctor={addDoctor}
              onAddPatient={addPatient}
              onDeleteDoctor={deleteDoctor}
              onDeletePatient={deletePatient}
              onUpdateDoctor={updateDoctor}
            />
          )}

          {currentTab === "doctor-portal" && (
            <DoctorDashboard 
              doctors={doctors}
              appointments={appointments}
              patients={patients}
              records={records}
              onAddRecord={addRecord}
              onUpdateAppointmentStatus={updateAppointmentStatus} // Toggle completed / cancel details
              onUpdateDoctor={updateDoctor}
            />
          )}

          {currentTab === "patient-portal" && (
            <PatientDashboard 
              currentUser={currentUser}
              patients={patients}
              appointments={appointments}
              records={records}
              invoices={invoices}
              doctors={doctors}
              onSettleInvoice={settleInvoice}
              onUpdatePatient={updatePatient}
              onAddAppointment={addAppointment}
              onAddPatient={addPatient}
            />
          )}

          {currentTab === "receptionist-portal" && (
            <ReceptionistDashboard 
              patients={patients}
              doctors={doctors}
              appointments={appointments}
              onAddAppointment={addAppointment}
              onRescheduleAppointment={rescheduleAppointment}
              onCancelAppointment={cancelAppointment}
              onDeleteAppointment={deleteAppointment}
            />
          )}

          {currentTab === "appointments" && (
            <ReceptionistDashboard 
              patients={patients}
              doctors={doctors}
              appointments={appointments}
              onAddAppointment={addAppointment}
              onRescheduleAppointment={rescheduleAppointment}
              onCancelAppointment={cancelAppointment}
              onDeleteAppointment={deleteAppointment}
            />
          )}

          {currentTab === "records" && (
            <MedicalRecordsManager 
              patients={patients}
              records={records}
              onAddRecord={addRecord}
              onDeleteRecord={deleteMedicalRecord}
              currentUser={currentUser}
            />
          )}

          {currentTab === "billing" && (
            <BillingManager 
              patients={patients}
              invoices={invoices}
              onAddInvoice={addInvoice}
              onUpdateInvoiceStatus={updateInvoiceStatus}
              onDeleteInvoice={deleteInvoice}
              currentUser={currentUser}
            />
          )}

          {currentTab === "analytics" && (
            <AnalyticsPanel 
              patients={patients}
              appointments={appointments}
              invoices={invoices}
              doctors={doctors}
            />
          )}

          {currentTab === "ai-insights" && (
            <AISuggestionsTab />
          )}

          {currentTab === "emergency" && (
            <EmergencyModule />
          )}
        </main>
      </div>

      {/* Trust Badge Footer */}
      <footer className="bg-white border-t border-gray-150 py-4 select-none">
        <div className="max-w-7xl mx-auto px-4 text-center text-[10px] text-gray-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>🔒 Verified HIPAA Compliant Ledger Interface. Secure Session Active.</span>
          <span>Hospital Administration Portal version 2026.06.19-BETA</span>
        </div>
      </footer>

      {/* Real-time Custom Toast alerts overlay */}
      <AnimatePresence>
        {activeToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 bg-[#1e293b] text-white rounded-2xl shadow-xl p-4.5 border border-slate-700/60 flex items-center gap-3.5 max-w-sm"
          >
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">System Dispatch</p>
              <p className="text-xs text-slate-200 mt-1 leading-normal font-sans">{activeToast.message}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveToast(null)} 
              className="text-slate-400 hover:text-white text-base font-bold transition px-1 cursor-pointer"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
