import React, { useState } from "react";
import { Patient, Doctor, Appointment, Invoice } from "../types";
import { Users, UserCheck, CreditCard, ShieldAlert, Sparkles, Building, Briefcase, Plus, HeartCrack, ChevronRight, Trash2, Edit } from "lucide-react";
import AISuggestionsTab from "./AISuggestionsTab";

interface AdminDashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  invoices: Invoice[];
  onAddDoctor: (doc: Omit<Doctor, "id">) => void;
  onAddPatient: (p: Omit<Patient, "id">) => void;
  onDeleteDoctor?: (id: string) => void;
  onDeletePatient?: (id: string) => void;
  onUpdateDoctor?: (id: string, updated: Partial<Doctor>) => void;
}

export default function AdminDashboard({ patients, doctors, appointments, invoices, onAddDoctor, onAddPatient, onDeleteDoctor, onDeletePatient, onUpdateDoctor }: AdminDashboardProps) {
  const [showDocForm, setShowDocForm] = useState(false);
  const [showPatForm, setShowPatForm] = useState(false);

  // New Doctor Form States
  const [docName, setDocName] = useState("");
  const [docDept, setDocDept] = useState("General Medicine");
  const [docSpec, setDocSpec] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docRoom, setDocRoom] = useState("");
  const [docHours, setDocHours] = useState("09:00 AM - 05:00 PM");

  // Edit Doctor Form States
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editDocName, setEditDocName] = useState("");
  const [editDocDept, setEditDocDept] = useState("General Medicine");
  const [editDocSpec, setEditDocSpec] = useState("");
  const [editDocRoom, setEditDocRoom] = useState("");
  const [editDocHours, setEditDocHours] = useState("");
  const [editDocPhone, setEditDocPhone] = useState("");
  const [editDocImage, setEditDocImage] = useState("");

  const handleStartEditDoc = (doc: Doctor) => {
    setEditingDoctorId(doc.id);
    setEditDocName(doc.name);
    setEditDocDept(doc.department);
    setEditDocSpec(doc.specialty || "");
    setEditDocRoom(doc.room || "");
    setEditDocHours(doc.availability?.hours || "");
    setEditDocPhone(doc.phone || "");
    setEditDocImage(doc.image || "");
  };

  const handleSaveEditDoc = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (onUpdateDoctor) {
      onUpdateDoctor(id, {
        name: editDocName,
        department: editDocDept,
        specialty: editDocSpec,
        room: editDocRoom,
        availability: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          hours: editDocHours
        },
        phone: editDocPhone,
        image: editDocImage
      });
    }
    setEditingDoctorId(null);
  };

  // New Patient Intake Form States
  const [patName, setPatName] = useState("");
  const [patEmail, setPatEmail] = useState("");
  const [patPhone, setPatPhone] = useState("");
  const [patDOB, setPatDOB] = useState("");
  const [patGender, setPatGender] = useState("Male");
  const [patBlood, setPatBlood] = useState("O+");
  const [patAllergies, setPatAllergies] = useState("None");
  const [patAddress, setPatAddress] = useState("");

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docEmail.trim()) return;
    onAddDoctor({
      name: docName,
      department: docDept,
      specialty: docSpec || "General Specialist",
      phone: docPhone || "+1 (555) 441-9922",
      email: docEmail,
      room: docRoom || "Clinic Wing A - Room 101",
      availability: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        hours: docHours
      }
    });

    // Reset
    setDocName("");
    setDocSpec("");
    setDocPhone("");
    setDocEmail("");
    setDocRoom("");
    setShowDocForm(false);
    alert(`Staff account initialized securely. Dr. ${docName} credential login link dispatched.`);
  };

  const handleCreatePat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patName.trim() || !patEmail.trim()) return;
    onAddPatient({
      name: patName,
      email: patEmail,
      phone: patPhone || "+1 (555) 000-0000",
      dob: patDOB || "1994-06-03",
      gender: patGender,
      bloodGroup: patBlood,
      address: patAddress || "Springfield",
      allergies: patAllergies,
      emergencyContact: {
        name: "Not Specified",
        relation: "Guardian",
        phone: "+1 (555) 001-0002"
      },
      status: "Outpatient"
    });

    // Reset
    setPatName("");
    setPatEmail("");
    setPatPhone("");
    setPatDOB("");
    setPatAllergies("None");
    setPatAddress("");
    setShowPatForm(false);
    alert(`Patient Intake File completed. ${patName} is active.`);
  };

  // Metrics Calculations
  const grossRev = invoices.reduce((sum, item) => sum + item.total, 0);
  const scheduledCount = appointments.filter(a => a.status === "Scheduled").length;

  return (
    <div className="space-y-6" id="admin-dashboard">
      {/* 4 Premium Stat Cards with Gradient headers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Patients</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{patients.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-medium block mt-3">Admitted & outpatient registers</span>
        </div>

        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clinical Staff</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{doctors.length}</h3>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-medium block mt-3">Assigned departments</span>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-green-600"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gross Billings</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">${grossRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-medium block mt-3">Insurance claims & card pays</span>
        </div>

        {/* Daily Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-450 to-orange-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scheduled Visits</p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">{scheduledCount}</h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-550 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-medium block mt-3">Awaiting triage clinical queue</span>
        </div>
      </div>

      {/* Roster & Directory Management Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Clinicians Staff Directory */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
            <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              Physician & Department Roster
            </h3>
            <button
              type="button"
              onClick={() => setShowDocForm(!showDocForm)}
              className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition"
            >
              {showDocForm ? "Hide Form" : "+ Add Physician"}
            </button>
          </div>

          {showDocForm && (
            <form onSubmit={handleCreateDoc} className="p-4 bg-gray-50/55 rounded-xl border border-gray-100 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Gregory House"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Primary Department</label>
                  <select
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  >
                    <option value="Diagnostics & Neurology">Diagnostics & Neurology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Immunology">Immunology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Medical Specialty</label>
                  <input
                    type="text"
                    placeholder="Neuropathology"
                    value={docSpec}
                    onChange={(e) => setDocSpec(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="house@smarthospital.org"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Office Practice Room</label>
                  <input
                    type="text"
                    placeholder="Room 402"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Availability Hours</label>
                  <input
                    type="text"
                    value={docHours}
                    onChange={(e) => setDocHours(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl"
              >
                Register Medical Doctor
              </button>
            </form>
          )}

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {doctors.map((doc) => {
              const isEditing = editingDoctorId === doc.id;
              return (
                <div key={doc.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition duration-150">
                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveEditDoc(e, doc.id)} className="space-y-3">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Edit Physician Details</span>
                        <button
                          type="button"
                          onClick={() => setEditingDoctorId(null)}
                          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Doctor Name</label>
                          <input
                            type="text"
                            required
                            value={editDocName}
                            onChange={(e) => setEditDocName(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Department</label>
                          <select
                            value={editDocDept}
                            onChange={(e) => setEditDocDept(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5 font-medium"
                          >
                            <option value="Diagnostics & Neurology">Diagnostics & Neurology</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="Immunology">Immunology</option>
                            <option value="General Medicine">General Medicine</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Specialty</label>
                          <input
                            type="text"
                            required
                            value={editDocSpec}
                            onChange={(e) => setEditDocSpec(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Practice Room</label>
                          <input
                            type="text"
                            required
                            value={editDocRoom}
                            onChange={(e) => setEditDocRoom(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Hours</label>
                          <input
                            type="text"
                            required
                            value={editDocHours}
                            onChange={(e) => setEditDocHours(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-500 uppercase">Phone</label>
                          <input
                            type="text"
                            required
                            value={editDocPhone}
                            onChange={(e) => setEditDocPhone(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase">Image URL</label>
                        <input
                          type="text"
                          value={editDocImage}
                          onChange={(e) => setEditDocImage(e.target.value)}
                          className="w-full text-xs p-1.5 bg-white border border-gray-200 rounded-lg mt-0.5"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
                      >
                        Save Profile Updates
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={doc.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"}
                          alt={doc.name}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-250 bg-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{doc.name}</h4>
                          <p className="text-[10px] text-teal-600 font-semibold tracking-wide uppercase mt-0.5">{doc.department} • {doc.specialty}</p>
                          <p className="text-[10px] text-gray-400 mt-1 truncate">📅 {doc.availability.hours} • Room: {doc.room}</p>
                          {doc.phone && <p className="text-[10px] text-gray-500 truncate">📞 {doc.phone}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditDoc(doc)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition cursor-pointer"
                          title="Edit Doctor Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteDoctor && (
                          <button
                            type="button"
                            onClick={() => onDeleteDoctor(doc.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                            title="Delete Doctor Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Registration Quick Desk */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
              <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                Active Patients Intake Registry
              </h3>
              <button
                type="button"
                onClick={() => setShowPatForm(!showPatForm)}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition"
              >
                {showPatForm ? "Hide Desk" : "+ Add Patient"}
              </button>
            </div>

            {showPatForm && (
              <form onSubmit={handleCreatePat} className="p-4 bg-gray-50/55 rounded-xl border border-gray-100 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Patient Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Diana Prince"
                      value={patName}
                      onChange={(e) => setPatName(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">DOB</label>
                    <input
                      type="date"
                      required
                      value={patDOB}
                      onChange={(e) => setPatDOB(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Gender</label>
                    <select
                      value={patGender}
                      onChange={(e) => setPatGender(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Blood Type</label>
                    <select
                      value={patBlood}
                      onChange={(e) => setPatBlood(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    >
                      <option value="A+">A+</option>
                      <option value="O-">O-</option>
                      <option value="B+">B+</option>
                      <option value="AB+">AB+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Allergies</label>
                    <input
                      type="text"
                      placeholder="Penicillin"
                      value={patAllergies}
                      onChange={(e) => setPatAllergies(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="diana@amazon.com"
                      value={patEmail}
                      onChange={(e) => setPatEmail(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 777-1012"
                      value={patPhone}
                      onChange={(e) => setPatPhone(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Intake Admission
                </button>
              </form>
            )}

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {patients.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition duration-150 text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-bold text-gray-900">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">ID: {p.id} • {p.gender} • Blood: {p.bloodGroup}</p>
                    <p className="text-[10px] text-gray-600 mt-1">📧 {p.email} • Allergies: {p.allergies}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.status === "Inpatient" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-sky-50 text-sky-850"
                    }`}>
                      {p.status}
                    </span>
                    {onDeletePatient && (
                      <button
                        type="button"
                        onClick={() => onDeletePatient(p.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition cursor-pointer"
                        title="Delete Patient Profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Integrated Recommendations summary */}
      <AISuggestionsTab />
    </div>
  );
}
