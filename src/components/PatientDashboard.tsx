import React, { useState, useEffect } from "react";
import { Patient, Appointment, MedicalRecord, Invoice, Doctor, User } from "../types";
import { 
  Calendar, 
  FileText, 
  Pill, 
  CreditCard, 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  User as UserIcon, 
  MapPin, 
  Phone, 
  CalendarClock, 
  Heart, 
  AlertOctagon, 
  Edit3, 
  Plus, 
  CheckCircle,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PatientDashboardProps {
  currentUser: User | null;
  patients: Patient[];
  appointments: Appointment[];
  records: MedicalRecord[];
  invoices: Invoice[];
  doctors: Doctor[];
  onSettleInvoice: (id: string) => void;
  onUpdatePatient: (id: string, updatedData: Partial<Patient>) => Promise<void>;
  onAddAppointment: (apt: Omit<Appointment, "id" | "status">) => Promise<void>;
  onAddPatient?: (p: Omit<Patient, "id">) => Promise<void>;
}

export default function PatientDashboard({ 
  currentUser,
  patients, 
  appointments, 
  records, 
  invoices, 
  doctors,
  onSettleInvoice,
  onUpdatePatient,
  onAddAppointment,
  onAddPatient
}: PatientDashboardProps) {
  
  // Try to find the patient record matching the logged-in user's email
  const selfPatient = patients.find(p => p.email.toLowerCase() === currentUser?.email?.toLowerCase());

  // Check if active user belongs to higher authorities & hospital management
  const isHospitalStaff = currentUser?.role === "admin" || currentUser?.role === "doctor" || currentUser?.role === "receptionist";

  // Allow switching patients for testing inside sandbox/simulator ONLY for hospital staff/authorities
  const [selectedPatientId, setSelectedPatientId] = useState("");

  useEffect(() => {
    if (selfPatient) {
      setSelectedPatientId(selfPatient.id);
    } else if (isHospitalStaff && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selfPatient, isHospitalStaff]);

  // Securely lock the patient ID for patient role
  const activePatientId = isHospitalStaff ? selectedPatientId : (selfPatient?.id || "");
  const currentPatient = patients.find(p => p.id === activePatientId);

  // Profile editing mode state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("Male");
  const [editBloodGroup, setEditBloodGroup] = useState("O+");
  const [editAddress, setEditAddress] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editECName, setEditECName] = useState("");
  const [editECRelation, setEditECRelation] = useState("");
  const [editECPhone, setEditECPhone] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Initialize editing state when patient is loaded
  useEffect(() => {
    if (currentPatient) {
      setEditPhone(currentPatient.phone || "");
      setEditDob(currentPatient.dob || "");
      setEditGender(currentPatient.gender || "Male");
      setEditBloodGroup(currentPatient.bloodGroup || "O+");
      setEditAddress(currentPatient.address || "");
      setEditAllergies(currentPatient.allergies || "");
      setEditECName(currentPatient.emergencyContact?.name || "");
      setEditECRelation(currentPatient.emergencyContact?.relation || "");
      setEditECPhone(currentPatient.emergencyContact?.phone || "");
    }
  }, [currentPatient, isEditingProfile]);

  // AI Symptoms Assistant triage & Appointment schedule forms
  const [patientComplaint, setPatientComplaint] = useState("");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [visitDateTime, setVisitDateTime] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  
  // AI analysis results
  const [aiTriageResult, setAiTriageResult] = useState<{
    department: string;
    urgency: "Low" | "Medium" | "High" | "Critical";
    reason: string;
    suggestedWindow: string;
  } | null>(null);

  // Medical speak translation state
  const [loadingAI, setLoadingAI] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState("");
  const [aiRecordId, setAiRecordId] = useState<string | null>(null);

  // Filter lists corresponding strictly to the securely resolved patient record
  const pAppointments = appointments.filter(a => a.patientId === activePatientId);
  const pRecords = records.filter(r => r.patientId === activePatientId);
  const pInvoices = invoices.filter(i => i.patientId === activePatientId);

  // Self-initialization intake card
  const [initLoading, setInitLoading] = useState(false);
  const handleCreatePatientIdentity = async () => {
    if (!currentUser) return;
    setInitLoading(true);
    try {
      if (onAddPatient) {
        await onAddPatient({
          name: currentUser.name,
          email: currentUser.email,
          phone: "+1 (555) 000-0000",
          dob: "1990-01-01",
          gender: "Male",
          bloodGroup: "O+",
          address: "Draft File",
          allergies: "None",
          emergencyContact: {
            name: "Not Specified",
            relation: "Spouse",
            phone: "+1 (555) 000-0000"
          },
          status: "Outpatient",
          admittedDate: "",
          roomNumber: ""
        });
        window.alert("EHR Clinic Profile successfully created!");
      }
    } catch (e) {
      console.error(e);
      window.alert("Failed to initialize intake record.");
    } finally {
      setInitLoading(false);
    }
  };

  // Save demographic details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setSaveLoading(true);

    try {
      await onUpdatePatient(currentPatient.id, {
        phone: editPhone,
        dob: editDob,
        gender: editGender,
        bloodGroup: editBloodGroup,
        address: editAddress,
        allergies: editAllergies,
        emergencyContact: {
          name: editECName,
          relation: editECRelation,
          phone: editECPhone
        }
      });
      setIsEditingProfile(false);
      window.alert("Your demographic clinical details have been successfully saved into security logs!");
    } catch (err) {
      console.error(err);
      window.alert("Failed to update clinical profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Run AI analysis on typed complaint
  const handleAnalyzeSymptoms = async () => {
    if (!patientComplaint.trim()) {
      window.alert("Please provide details about your symptom logs so our AI clinical co-pilot can parse department urgency.");
      return;
    }
    setTriageLoading(true);
    setAiTriageResult(null);

    try {
      const resp = await fetch("/api/ai/appointment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: patientComplaint, triageNote: "Patient self-assessment portal check." })
      });
      if (resp.ok) {
        const data = await resp.json();
        setAiTriageResult(data);
        
        // Auto-select a doctor from recommended department if available
        const matchedDoc = doctors.find(d => d.department.toLowerCase() === data.department.toLowerCase());
        if (matchedDoc) {
          setSelectedDocId(matchedDoc.id);
        } else if (doctors.length > 0) {
          setSelectedDocId(doctors[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setAiTriageResult({
        department: "General Medicine",
        urgency: "Medium",
        reason: "Based on report characteristics, a standard diagnostic review in clinical general ward is recommended.",
        suggestedWindow: "Within 48 hours"
      });
    } finally {
      setTriageLoading(false);
    }
  };

  // Confirm booking
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    if (!selectedDocId || !visitDateTime) {
      window.alert("Select both a designated physician and desired consultation time.");
      return;
    }

    const doc = doctors.find(d => d.id === selectedDocId);
    if (!doc) return;

    try {
      await onAddAppointment({
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        doctorId: doc.id,
        doctorName: doc.name,
        department: doc.department,
        dateTime: visitDateTime,
        notes: patientComplaint || "Patient Self-Requested Consultation",
        triageNote: aiTriageResult ? `AI Urgency: ${aiTriageResult.urgency}. ${aiTriageResult.reason}` : "Self-booked"
      });
      
      // Clean up forms
      setPatientComplaint("");
      setAiTriageResult(null);
      setVisitDateTime("");
      window.alert(`Appointment request successfully booked with ${doc.name} for ${visitDateTime.replace('T', ' ')}!`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to submit appointment request.");
    }
  };

  // Translate jargon using AI
  async function triggerAISimplify(rec: MedicalRecord) {
    setLoadingAI(true);
    setAiRecordId(rec.id);
    setSimplifiedText("");
    try {
      const resp = await fetch("/api/ai/patient-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: rec.patientId,
          symptoms: rec.symptoms,
          diagnosis: rec.diagnosis,
          treatment: rec.treatment,
          prescription: rec.prescription,
          labRecord: rec.labRecord
        })
      });
      const d = await resp.json();
      setSimplifiedText(d.summary);
    } catch (err) {
      console.error(err);
      setSimplifiedText("Failed to simplify clinical details at this moment.");
    } finally {
      setLoadingAI(false);
    }
  }

  // Detect whether profile has template settings
  const isProfileIncomplete = !currentPatient?.phone || currentPatient.phone.includes("000-0000") || !currentPatient?.address || currentPatient.address === "Not Specified" || currentPatient.address === "Draft File";

  return (
    <div className="space-y-6" id="patient-dashboard">
      
      {/* Patient Profile Selector or Secure Personal Welcome Banner */}
      {isHospitalStaff ? (
        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Identity Center (Staff Simulator View)</h3>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {selfPatient?.id === selectedPatientId ? "Viewing Your Signed-in Personal Health Profile" : "Interactive Mock Identity Sandbox View"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Testing Profile:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="text-xs focus:ring-2 focus:ring-blue-500 font-bold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.email === currentUser?.email ? "(You)" : `[ID: ${p.id}]`}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-650 rounded-2xl border border-indigo-100">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-550 uppercase tracking-widest block font-mono">SECURE PATIENT PORTAL ACTIVE</span>
              <h2 className="text-base font-black text-slate-900 mt-0.5">Welcome to your secure health workspace, {currentUser?.name}!</h2>
              <p className="text-xs text-slate-500 mt-0.5">Your clinical charts, diagnoses, and financial ledgers are restricted under HIPAA-compliant access keys.</p>
            </div>
          </div>
        </div>
      )}

      {/* Handle Missing / Uninitialized EHR Intakes */}
      {!currentPatient && (
        <div className="bg-white p-8 rounded-2xl border border-rose-150 shadow-xs text-center space-y-4 max-w-xl mx-auto my-6">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full inline-block">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-rose-950">EHR Identity File Initializing</h3>
            <p className="text-xs text-gray-550 max-w-sm mx-auto leading-normal">
              State regulations and HIPAA protocols require an active Electronic Health Record (EHR) demographics intake file associated with your credentials before booking or consulting.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreatePatientIdentity}
            disabled={initLoading}
            className="px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 mx-auto disabled:bg-gray-100"
          >
            {initLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating EHR File...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Initialize My Digital Health Card Now
              </>
            )}
          </button>
        </div>
      )}

      {/* Profile Incomplete Warning Ribbon */}
      {isProfileIncomplete && currentPatient && (
        <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertOctagon className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-normal">
            <p className="font-bold">Patient Demographics Incomplete</p>
            <p className="text-amber-700 mt-0.5 mt-1 font-medium">
              You are currently logged into an placeholder clinic file. State regulations require you to supply an emergency contact and clinical hypersensitivities check before clinical booking.
            </p>
            <button
              onClick={() => setIsEditingProfile(true)}
              className="mt-2 text-[11px] font-bold text-amber-905 underline hover:text-amber-950 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Complete Intake Form Now
            </button>
          </div>
        </div>
      )}

      {currentPatient && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider">
                EHR Electronic Health Record
              </span>
              <h2 className="text-2xl font-black tracking-tight">{currentPatient.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-350">
                <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> ID: {currentPatient.id}</span>
                <span className="flex items-center gap-1">• 📧 {currentPatient.email}</span>
                <span className="flex items-center gap-1">• <Phone className="w-3.5 h-3.5" /> {currentPatient.phone}</span>
              </div>
              <p className="text-xs text-slate-350 flex items-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> Intake Residence: <span className="text-slate-200 font-semibold">{currentPatient.address}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="text-center p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 min-w-[70px]">
                <p className="text-[9px] text-slate-400 uppercase font-black uppercase tracking-widest">Blood</p>
                <p className="text-base font-black text-rose-500 mt-0.5">{currentPatient.bloodGroup}</p>
              </div>
              <div className="text-center p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 min-w-[85px]">
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Born</p>
                <p className="text-xs font-bold text-slate-200 mt-1">{currentPatient.dob}</p>
              </div>
              <div className="text-center p-3 bg-rose-950/40 rounded-xl border border-rose-950/80 min-w-[120px] max-w-[160px]">
                <p className="text-[9px] text-rose-400 uppercase font-black tracking-widest">Allergies</p>
                <p className="text-xs font-bold text-rose-350 truncate mt-1" title={currentPatient.allergies}>
                  {currentPatient.allergies || "None logged"}
                </p>
              </div>
              
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>

          {currentPatient.emergencyContact && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span>🚨 Emergency Representative Contact: <strong className="text-slate-200">{currentPatient.emergencyContact.name} ({currentPatient.emergencyContact.relation})</strong></span>
              <span>Contact Hotline: <strong className="text-slate-200">{currentPatient.emergencyContact.phone}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Demographics Intake & Edit Card (Collapsible) */}
      <AnimatePresence>
        {isEditingProfile && currentPatient && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white border border-blue-150 rounded-2xl"
          >
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-150">
                <span className="font-bold text-gray-950 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Intake Demographic & Clinical File Editor
                </span>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="text-xs text-gray-400 hover:text-gray-900 font-bold">&times; Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Contact Phone Number</label>
                  <input 
                    type="text" 
                    value={editPhone} 
                    onChange={e => setEditPhone(e.target.value)} 
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={editDob} 
                    onChange={e => setEditDob(e.target.value)} 
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                    <select 
                      value={editGender} 
                      onChange={e => setEditGender(e.target.value)} 
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Blood Group</label>
                    <select 
                      value={editBloodGroup} 
                      onChange={e => setEditBloodGroup(e.target.value)} 
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold text-red-650"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Intake Home Residence Address</label>
                <input 
                  type="text" 
                  value={editAddress} 
                  onChange={e => setEditAddress(e.target.value)} 
                  placeholder="Street Address, City, State ZIP"
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Clinical Hypersensitivities & Allergies (e.g. Penicillin, Latex)</label>
                <input 
                  type="text" 
                  value={editAllergies} 
                  onChange={e => setEditAllergies(e.target.value)} 
                  placeholder="Specify allergies clearly or enter 'None'"
                  className="w-full text-xs p-2.5 bg-rose-50/20 text-rose-950 border border-rose-250 rounded-xl focus:border-rose-500 focus:outline-hidden font-semibold"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Emergency Contact Authorized Representative</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-500 uppercase mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editECName} 
                      onChange={e => setEditECName(e.target.value)} 
                      placeholder="e.g. Marc Cooper"
                      className="w-full text-xs p-2.5 bg-white border border-gray-250 rounded-lg focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-500 uppercase mb-1">Relationship</label>
                    <input 
                      type="text" 
                      value={editECRelation} 
                      onChange={e => setEditECRelation(e.target.value)} 
                      placeholder="e.g. Spouse / Brother / Guardian"
                      className="w-full text-xs p-2.5 bg-white border border-gray-250 rounded-lg focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editECPhone} 
                      onChange={e => setEditECPhone(e.target.value)} 
                      placeholder="+1 (555) 000-0000"
                      className="w-full text-xs p-2.5 bg-white border border-gray-250 rounded-lg focus:border-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)} 
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel Changes
                </button>
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5"
                >
                  {saveLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Save EHR Demographic Profile
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Clinicians and upcoming schedules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              Symptom consultations & visits
            </h3>

            {pAppointments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">No upcoming doctor appointments booked.</div>
            ) : (
              <div className="space-y-3">
                {pAppointments.map((apt) => (
                  <div key={apt.id} className="p-3.5 bg-gray-50/70 border border-gray-100 rounded-xl text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900">{apt.doctorName}</h4>
                        <span className="text-[10px] text-blue-600 font-semibold uppercase">{apt.department}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        apt.status === "Scheduled" ? "bg-blue-50 text-blue-800 border border-blue-100" :
                        apt.status === "Completed" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-2 text-[10px] uppercase font-semibold">📅 {apt.dateTime.replace('T', ' ')}</p>
                    {apt.notes && <p className="text-gray-700 mt-1 pb-1 leading-normal">📝 <strong>Symptom/Reason:</strong> {apt.notes}</p>}
                    {apt.triageNote && (
                      <div className="bg-white p-2 border border-blue-105 rounded-lg text-[10px] text-blue-900 font-medium mt-1">
                        🩺 Triage Remarks: {apt.triageNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-105 inline-flex items-start gap-2 text-[11px] text-blue-900 mt-4 leading-normal">
            <span className="text-base select-none">💡</span>
            <span>Verify assigned room locations or log diagnostic cards with your attending physicians below.</span>
          </div>
        </div>

        {/* Dynamic Consultation Booking with Gemini Triage Assistant */}
        <div className="bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 p-6 rounded-2xl border border-blue-150 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
              AI-Guided Clinical Booking & Triage Assistant
            </h3>
            
            <p className="text-xs text-gray-500 leading-normal">
              Describe your current symptoms or physical issues. Our medical AI will triage the clinical urgency level and automatically route you to the appropriate medical specialty.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">State Your Clinical Complaint / Symptom Log</label>
                <textarea
                  value={patientComplaint}
                  onChange={e => setPatientComplaint(e.target.value)}
                  placeholder="e.g. Intense migraine since yesterday evening. Occasional floating dark spots in vision and pain when turning my neck..."
                  rows={3}
                  className="w-full text-xs p-3 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAnalyzeSymptoms}
                  disabled={triageLoading || !patientComplaint.trim()}
                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {triageLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Triage analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Request AI Urgency Route
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Recommendation Panel */}
            {aiTriageResult && (
              <div className="p-4 bg-white border border-indigo-200 rounded-xl space-y-2 text-xs relative overflow-hidden shadow-2xs">
                <div className="absolute right-0 top-0 text-[10px] font-bold px-2.5 py-1 uppercase rounded-bl-xl border-l border-b border-rose-100 bg-rose-50 text-rose-700 select-none">
                  AI Urgency: {aiTriageResult.urgency}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-indigo-550 block">Diagnosed Specialty Recommendation</span>
                  <p className="text-gray-900 font-bold text-sm mt-0.5">{aiTriageResult.department}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-gray-400 block mt-1.5">Diagnostic Reasoning & Advice</span>
                  <p className="text-gray-600 mt-0.5 line-clamp-3 leading-relaxed">{aiTriageResult.reason}</p>
                </div>
                <div className="text-[10px] font-medium text-slate-500 pt-1.5 border-t border-gray-100 flex justify-between">
                  <span>Suggested Window: <strong>{aiTriageResult.suggestedWindow}</strong></span>
                </div>
              </div>
            )}

            {/* Commit Booking Form */}
            <form onSubmit={handleConfirmBooking} className="pt-3 border-t border-gray-150 space-y-3">
              <span className="text-[10px] font-black text-gray-405 uppercase tracking-wider block">Clinical Booking Commit Ledger</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-semibold text-gray-500 uppercase mb-1">Clinic Physician</label>
                  <select
                    value={selectedDocId}
                    onChange={e => setSelectedDocId(e.target.value)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-900 font-bold"
                  >
                    <option value="">-- Choose Physican --</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-gray-500 uppercase mb-1">Consultation Date & Time</label>
                  <input
                    type="datetime-local"
                    value={visitDateTime}
                    onChange={e => setVisitDateTime(e.target.value)}
                    className="w-full text-xs p-2 bg-gray-50 border border-gray-250 rounded-lg font-bold"
                  />
                </div>
              </div>

              {selectedDocId && (
                (() => {
                  const doc = doctors.find(d => d.id === selectedDocId);
                  if (!doc) return null;
                  return (
                    <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100 flex items-start gap-3 mt-1 select-none">
                      <img
                        src={doc.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"}
                        alt={doc.name}
                        className="w-12 h-12 object-cover rounded-xl border border-blue-200 shrink-0"
                      />
                      <div className="text-[11px] space-y-1 min-w-0">
                        <h4 className="font-bold text-blue-950 truncate">{doc.name}</h4>
                        <p className="text-[10px] text-blue-800 font-semibold">{doc.specialty} • {doc.department}</p>
                        <div className="text-[10px] text-gray-500 mt-1 space-y-0.5 font-medium">
                          <p>🚪 <strong>Office / Room:</strong> {doc.room || 'General Ward'}</p>
                          <p>🕒 <strong>Practice Hours:</strong> {doc.availability?.hours || '09:00 AM - 05:00 PM'}</p>
                          <p>📅 <strong>Available Days:</strong> {Array.isArray(doc.availability?.days) ? doc.availability.days.join(", ") : (doc.availability?.days || 'Mon, Tue, Wed, Thu, Fri')}</p>
                          {doc.phone && <p>📞 <strong>Phone:</strong> {doc.phone}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}

              <button
                type="submit"
                disabled={!selectedDocId || !visitDateTime}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <CalendarClock className="w-4 h-4" />
                Confirm Clinic Consultation Book
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Financial Billing Accounts tab */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Healthcare Ledgers & Diagnostic Billing Balance
        </h3>

        {pInvoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">No pending ledger invoices under your file.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pInvoices.map((inv) => {
              const balance = inv.total - inv.paidAmount;
              return (
                <div key={inv.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-150 rounded-xl transition text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono bg-white px-2 py-0.5 rounded border border-gray-100">{inv.id}</span>
                        <h4 className="text-gray-950 font-black mt-2 text-sm">Bill Balance: ${inv.total.toFixed(2)}</h4>
                        <span className="block text-[10px] text-gray-500 uppercase mt-1">Due: {inv.dueDate}</span>
                      </div>
                      <span className={`text-[9px] font-black py-0.5 px-2 rounded-full uppercase tracking-wider border ${
                        inv.status === "Paid" ? "bg-emerald-50 text-emerald-800 border-emerald-250" :
                        inv.status === "Partially Paid" ? "bg-amber-50 text-amber-805 border-amber-250" : "bg-rose-50 text-rose-800 border-rose-250"
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    {/* Display itemized cost */}
                    <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-1">
                      {inv.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-[10px] text-gray-650 font-medium">
                          <span>- {it.description}</span>
                          <span className="font-bold text-gray-900">${it.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/50 flex justify-between items-center text-xs">
                    <div className="text-gray-600 font-medium">
                      Unsettled Balance: <strong className="text-rose-600">${balance.toFixed(2)}</strong>
                    </div>
                    {balance > 0 && (
                      <button
                        type="button"
                        onClick={() => onSettleInvoice(inv.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3.5 rounded-lg text-[10px] transition shadow-2xs cursor-pointer"
                      >
                        Claim / Settle Bill Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clinical Diagnosis Medical history & AI jargon translator */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <h3 className="text-sm font-bold text-gray-950 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Clinical Diagnoses & Medical History Charts
        </h3>

        {pRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">No active medical records charts logged in clinical history.</div>
        ) : (
          <div className="space-y-6">
            {pRecords.map((rec) => (
              <div key={rec.id} className="p-5 bg-gray-50/50 border border-gray-100 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200/40 pb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Diagnosis: {rec.diagnosis}</h4>
                    <span className="text-[10px] text-gray-400 font-semibold block mt-0.5 animate-pulse">Diagnostics Specialist: {rec.diagnosedBy} • Date logged: {rec.date}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerAISimplify(rec)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    Translate Jargon to Plain English
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 tracking-wider">Symptoms Evaluated</strong>
                    <p className="text-gray-700 mt-1 font-medium leading-relaxed">{rec.symptoms}</p>
                  </div>
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 tracking-wider">Treatment Protocol</strong>
                    <p className="text-gray-700 mt-1 font-medium leading-relaxed">{rec.treatment}</p>
                  </div>
                  <div>
                    <strong className="text-[10px] uppercase text-gray-400 tracking-wider">Active Prescribed Medications</strong>
                    <p className="text-gray-750 mt-1 font-mono leading-relaxed whitespace-pre-line text-[11px] bg-white p-2 border border-gray-150 rounded-lg">{rec.prescription || "No active prescriptions loaded."}</p>
                  </div>
                </div>

                {/* AI translation result */}
                {aiRecordId === rec.id && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50/40 border border-blue-105 p-4.5 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider select-none">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      Gemini Clinical Co-Pilot Layman translation
                    </span>
                    {loadingAI ? (
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-bold py-1">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Simplifying clinical details...
                      </div>
                    ) : (
                      <p className="text-indigo-950 text-xs font-semibold leading-relaxed whitespace-pre-line select-text">{simplifiedText}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
