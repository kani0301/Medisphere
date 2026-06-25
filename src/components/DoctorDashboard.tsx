import React, { useState } from "react";
import { Doctor, Appointment, Patient, MedicalRecord } from "../types";
import { UserCheck, Calendar, Activity, Sparkles, ClipboardList, PenTool, CheckCircle2, HeartPulse, User } from "lucide-react";

interface DoctorDashboardProps {
  doctors: Doctor[];
  appointments: Appointment[];
  patients: Patient[];
  records: MedicalRecord[];
  onAddRecord: (rec: Omit<MedicalRecord, "id">) => void;
  onUpdateAppointmentStatus: (id: string, status: "Completed" | "Cancelled") => void;
  onUpdateDoctor?: (id: string, updated: Partial<Doctor>) => void;
}

export default function DoctorDashboard({ doctors, appointments, patients, records, onAddRecord, onUpdateAppointmentStatus, onUpdateDoctor }: DoctorDashboardProps) {
  // Let the user switch between demo doctors to inspect each's dashboard beautifully!
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id || "");

  // Form write state
  const [activeAptForForm, setActiveAptForForm] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [labRecord, setLabRecord] = useState("");

  // AI translator
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Edit Clinic Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editSpec, setEditSpec] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHours, setEditHours] = useState("");
  const [editDays, setEditDays] = useState("");
  const [editImage, setEditImage] = useState("");

  const currentDoctor = doctors.find(d => d.id === selectedDoctorId);

  const handleStartEditProfile = () => {
    if (!currentDoctor) return;
    setEditSpec(currentDoctor.specialty || "");
    setEditRoom(currentDoctor.room || "");
    setEditPhone(currentDoctor.phone || "");
    setEditHours(currentDoctor.availability?.hours || "");
    setEditDays(Array.isArray(currentDoctor.availability?.days) ? currentDoctor.availability.days.join(", ") : (currentDoctor.availability?.days || ""));
    setEditImage(currentDoctor.image || "");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDoctor || !onUpdateDoctor) return;
    const daysArray = editDays.split(",").map(d => d.trim()).filter(Boolean);
    onUpdateDoctor(currentDoctor.id, {
      specialty: editSpec,
      room: editRoom,
      phone: editPhone,
      availability: {
        days: daysArray,
        hours: editHours
      },
      image: editImage
    });
    setIsEditingProfile(false);
    alert("Clinic profile details updated successfully!");
  };

  // Today's appointments for selected doctor
  const docAppointments = appointments.filter(apt => apt.doctorId === selectedDoctorId);

  // Assigned unique patients
  const uniquePatientIds = Array.from(new Set(docAppointments.map(a => a.patientId)));
  const docPatients = patients.filter(p => uniquePatientIds.includes(p.id));

  const handleOpenDiagnosticForm = (apt: Appointment) => {
    setActiveAptForForm(apt);
    setSymptoms(apt.triageNote || "");
    setDiagnosis("");
    setTreatment("");
    setPrescription("");
    setLabRecord("");
    setAiAnalysis("");
  };

  const handleCommitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAptForForm || !diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }

    onAddRecord({
      patientId: activeAptForForm.patientId,
      patientName: activeAptForForm.patientName,
      date: new Date().toISOString().split("T")[0],
      diagnosedBy: currentDoctor?.name || "Consultant Physician",
      diagnosis,
      symptoms,
      treatment,
      prescription,
      labRecord
    });

    onUpdateAppointmentStatus(activeAptForForm.id, "Completed");
    setActiveAptForForm(null);
    alert(`Diagnostics logged. Appointment status updated to Completed!`);
  };

  async function triggerGeminiDiagnosisCoPilot() {
    if (!diagnosis.trim()) {
      alert("Please specify a preliminary diagnosis before requesting co-pilot review.");
      return;
    }
    setLoadingAI(true);
    setAiAnalysis("");
    try {
      const resp = await fetch("/api/ai/patient-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activeAptForForm?.patientId,
          symptoms,
          diagnosis,
          treatment,
          prescription,
          labRecord
        })
      });
      const d = await resp.json();
      setAiAnalysis(d.summary);
    } catch (err) {
      console.error(err);
      setAiAnalysis("Failed to consult Gemini Co-Pilot at this moment.");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="space-y-6" id="doctor-dashboard">
      
      {/* Clinician Selector for review */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Attending Clinician Console</h3>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">Toggle attending physicians to review distinct caseload schedules</p>
        </div>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          className="text-xs focus:ring-2 focus:ring-blue-500 font-bold bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2"
        >
          {doctors.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.department})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments Feed Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Schedules & Scheduled Appointments
            </h3>

            {docAppointments.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No scheduled visits booked under this Physician.
              </div>
            ) : (
              <div className="space-y-3">
                {docAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-950 text-xs">{apt.patientName}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === "Scheduled" ? "bg-blue-105 text-blue-700 font-mono" :
                          apt.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          "bg-rose-50 text-rose-700"
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-gray-500 text-[10px] uppercase font-semibold mt-0.5">📅 {apt.dateTime.replace('T', ' ')}</p>
                      {apt.notes && <p className="text-gray-650 mt-1.5 font-medium">📋 {apt.notes}</p>}
                      {apt.triageNote && (
                        <p className="bg-white px-2 py-1 border border-gray-200/50 rounded-md text-[10px] text-gray-600 mt-1 font-mono">
                          🩸 Triage Vitals: {apt.triageNote}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {apt.status === "Scheduled" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenDiagnosticForm(apt)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] transition"
                          >
                            Diagnose & Chart
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateAppointmentStatus(apt.id, "Cancelled")}
                            className="text-rose-600 hover:text-rose-700 bg-white border border-rose-200 font-bold py-1.5 px-3 rounded-lg text-[10px] transition"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostic intake form co-pilot */}
          {activeAptForForm && (
            <form onSubmit={handleCommitRecord} className="bg-white p-6 rounded-2xl border border-blue-200/60 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-gray-950 text-sm flex items-center gap-1.5">
                  <PenTool className="w-4.5 h-4.5 text-blue-600" />
                  Clinical Diagnostic Entry: {activeAptForForm.patientName}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveAptForForm(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-gray-750 mb-1">Presented Symptoms</label>
                  <textarea
                    required
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 h-16"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-750 mb-1">Final Diagnosis</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Lyme Relapsing RR / Acute Allergies"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-gray-750 mb-1">Treatment & Clinical Action Taken</label>
                  <textarea
                    required
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 h-16"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-750 mb-1">Issued Prescription Details</label>
                  <textarea
                    placeholder="Gabapentin 300mg QHS x30 Days"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 h-16"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-750 mb-1">Lab Testing Results / Imaging Notes</label>
                <textarea
                  placeholder="Lyme ELISA assay Positive / Chest X-Ray negative"
                  value={labRecord}
                  onChange={(e) => setLabRecord(e.target.value)}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 h-16"
                />
              </div>

              {/* Gemini clinical helper */}
              <div className="bg-gradient-to-r from-blue-50/55 to-indigo-50/55 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 select-none">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    Gemini AI Clinical Triage Co-Pilot
                  </span>
                  <button
                    type="button"
                    onClick={triggerGeminiDiagnosisCoPilot}
                    disabled={loadingAI}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] rounded-lg transition"
                  >
                    {loadingAI ? "Consulting..." : "Scan Diagnostics with AI"}
                  </button>
                </div>
                {aiAnalysis && (
                  <p className="text-xs text-blue-950 font-medium leading-relaxed mt-2 whitespace-pre-line p-0.5 select-text">{aiAnalysis}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-semibold rounded-xl"
                >
                  Commit Chart & Settle Visit
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Doctor Patients Column */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-650" />
              Assigned Patient Roster
            </h3>

            {docPatients.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">No active patient files linked under your slots.</div>
            ) : (
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {docPatients.map((p) => {
                  const pRecs = records.filter(r => r.patientId === p.id);
                  return (
                    <div key={p.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition text-xs relative overflow-hidden">
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-teal-400 to-emerald-500"></div>
                      <h4 className="font-bold text-gray-900">{p.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">ID: {p.id} • {p.gender} • Blood: {p.bloodGroup}</p>
                      <p className="text-[10px] text-gray-500 mt-1">⚠️ Allergies: {p.allergies}</p>
                      {pRecs.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-gray-250/50 text-[10px] text-teal-800">
                          <strong>Latest History:</strong> {pRecs[pRecs.length - 1].diagnosis}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {currentDoctor && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-5 h-5 text-teal-650" />
                  Clinic Profile Details
                </h3>
                {!isEditingProfile && onUpdateDoctor && (
                  <button
                    type="button"
                    onClick={handleStartEditProfile}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg transition"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Specialty</label>
                    <input
                      type="text"
                      required
                      value={editSpec}
                      onChange={(e) => setEditSpec(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Office Practice Room</label>
                    <input
                      type="text"
                      required
                      value={editRoom}
                      onChange={(e) => setEditRoom(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Practice Hours</label>
                    <input
                      type="text"
                      required
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Practice Days (comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={editDays}
                      onChange={(e) => setEditDays(e.target.value)}
                      placeholder="Monday, Tuesday, Wednesday"
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Avatar Image URL</label>
                    <input
                      type="text"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-center"
                    >
                      Save Profile
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentDoctor.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=120"}
                      alt={currentDoctor.name}
                      className="w-14 h-14 object-cover rounded-xl border border-teal-100 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900">{currentDoctor.name}</h4>
                      <p className="text-[10px] text-teal-600 font-semibold tracking-wide uppercase mt-0.5">{currentDoctor.department}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 p-3.5 rounded-xl border border-gray-100 space-y-2 text-gray-600 text-[11px]">
                    <p>🩺 <strong>Specialty:</strong> {currentDoctor.specialty}</p>
                    <p>🚪 <strong>Office Room:</strong> {currentDoctor.room}</p>
                    <p>📞 <strong>Phone:</strong> {currentDoctor.phone || 'Not Specified'}</p>
                    <p>🕒 <strong>Hours:</strong> {currentDoctor.availability?.hours}</p>
                    <p>📅 <strong>Days:</strong> {Array.isArray(currentDoctor.availability?.days) ? currentDoctor.availability.days.join(", ") : (currentDoctor.availability?.days || 'Not set')}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
