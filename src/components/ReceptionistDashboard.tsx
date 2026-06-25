import React, { useState } from "react";
import { Patient, Doctor, Appointment } from "../types";
import { BookOpen, Plus, Calendar, AlertCircle, Sparkles, RefreshCcw, Activity } from "lucide-react";

interface ReceptionistDashboardProps {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  onAddAppointment: (apt: Omit<Appointment, "id" | "status">) => void;
  onRescheduleAppointment: (id: string, dateTime: string) => void;
  onCancelAppointment: (id: string) => void;
  onDeleteAppointment?: (id: string) => void;
}

export default function ReceptionistDashboard({ patients, doctors, appointments, onAddAppointment, onRescheduleAppointment, onCancelAppointment, onDeleteAppointment }: ReceptionistDashboardProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [triageNote, setTriageNote] = useState("");
  const [showBookingForm, setShowBookingForm] = useState(false);

  // AI states
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    department: string;
    urgency: string;
    reason: string;
    suggestedWindow: string;
  } | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const activeAppointments = appointments.filter(apt =>
    apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !dateTime) {
      alert("Please fill in patient, physician, and date/time.");
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    const doctor = doctors.find(d => d.id === selectedDoctorId);

    if (!patient || !doctor) return;

    onAddAppointment({
      patientId: selectedPatientId,
      patientName: patient.name,
      doctorId: selectedDoctorId,
      doctorName: doctor.name,
      department: doctor.department,
      dateTime,
      notes,
      triageNote
    });

    // Reset Form
    setSelectedPatientId("");
    setSelectedDoctorId("");
    setDateTime("");
    setNotes("");
    setTriageNote("");
    setAiSuggestion(null);
    setShowBookingForm(false);
    alert("Appointment successfully committed and staff paged.");
  };

  async function triggerAIAssistedSpecialistRoute() {
    if (!notes.trim()) {
      alert("Please specify patient complaints / symptom logs for analysis.");
      return;
    }
    setLoadingAI(true);
    setAiSuggestion(null);
    try {
      const resp = await fetch("/api/ai/appointment-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, triageNote })
      });
      const data = await resp.json();
      setAiSuggestion(data);

      // Auto select matching doctor department if found!
      if (data.department) {
        const matchedDoc = doctors.find(doc => doc.department.toLowerCase().includes(data.department.toLowerCase()) || data.department.toLowerCase().includes(doc.department.toLowerCase()));
        if (matchedDoc) {
          setSelectedDoctorId(matchedDoc.id);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to analyze. Check network settings.");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="space-y-6" id="receptionist-dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Front-Desk Triage & Visit Coordinator</h2>
          <p className="text-xs text-gray-500 mt-1">Book consultations, evaluate incoming triage complaints, and dispatch schedules.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowBookingForm(!showBookingForm)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showBookingForm ? "Hide Triage Panel" : "Book New Consultation"}
        </button>
      </div>

      {showBookingForm && (
        <form onSubmit={handleBook} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Patient Clinical Triage Intake form
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Patient File</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose active patient file --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} [{p.phone}]</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Schedule date & Slot time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presented Symptoms complaints & Reasons for scheduling</label>
              <textarea
                placeholder="Ex. Cyclical headers, chest tightness, palpitations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
                required
              />
              <button
                type="button"
                onClick={triggerAIAssistedSpecialistRoute}
                disabled={loadingAI || !notes.trim()}
                className="mt-2.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 text-[10px] font-bold text-blue-700 rounded-lg transition duration-150 flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-650 animate-pulse" />
                Analyze Complaints with Gemini AI co-pilot
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Triage Nurse Remarks (Vitals stats, weights, BP alerts)</label>
              <textarea
                placeholder="Ex. Temp: 98.6 F • BP: 140/90 (mildly high) • SpO2: 98%"
                value={triageNote}
                onChange={(e) => setTriageNote(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
              />
            </div>
          </div>

          {/* AI suggestion panel */}
          {aiSuggestion && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-105 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                Gemini Specialist routing recommendation
              </span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-bold text-[9px] uppercase">Matching Specialty</span>
                  <p className="font-bold text-xs text-blue-900 mt-0.5">{aiSuggestion.department}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-bold text-[9px] uppercase">Urgency Assessment</span>
                  <p className="font-bold text-xs text-rose-700 mt-0.5">{aiSuggestion.urgency}</p>
                </div>
              </div>
              <p className="text-xs text-gray-705 mt-1 leading-normal"><strong className="text-[10px] text-blue-900">Diagnosis rationale:</strong> {aiSuggestion.reason}</p>
              <p className="text-[10px] text-emerald-700 font-semibold">📅 Recommended timeline: {aiSuggestion.suggestedWindow}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select Physician</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Choose attending doctor (Select matching department) --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} [{d.department}] ({d.availability.hours})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowBookingForm(false)}
              className="px-4 py-2 border border-gray-250 text-xs font-semibold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-xs"
            >
              Confirm Appointment Schedule
            </button>
          </div>
        </form>
      )}

      {/* Appointment schedules lists */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-blue-600" />
            Hospital Appointment Ledger list
          </h3>
          <input
            type="text"
            placeholder="Search by patient, physician, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3.5 py-1.5 focus:border-blue-600 bg-white border border-gray-200 rounded-lg max-w-xs focus:outline-hidden"
          />
        </div>

        {activeAppointments.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No scheduling records logged matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/20 text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100/55">
                  <th className="py-3.5 px-5">APT ID</th>
                  <th className="py-3.5 px-5">Patient Name</th>
                  <th className="py-3.5 px-5">Assigned Clinician</th>
                  <th className="py-3.5 px-5">Department Specialty</th>
                  <th className="py-3.5 px-5">Schedule Time</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5">Triage notes</th>
                  <th className="py-3.5 px-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50/30 transition">
                    <td className="py-3.5 px-5 font-bold font-mono text-gray-800">{apt.id}</td>
                    <td className="py-3.5 px-5 font-bold text-gray-950">{apt.patientName}</td>
                    <td className="py-3.5 px-5 text-gray-700 font-medium">{apt.doctorName}</td>
                    <td className="py-3.5 px-5 font-semibold text-blue-600">{apt.department}</td>
                    <td className="py-3.5 px-5 text-gray-500 font-mono">{apt.dateTime.replace('T', ' ')}</td>
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block text-[9px] uppercase font-bold py-1 px-2.5 rounded-full ${
                        apt.status === "Scheduled" ? "bg-blue-105 text-blue-700 font-mono" :
                        apt.status === "Completed" ? "bg-emerald-50 text-emerald-800" :
                        "bg-rose-50 text-rose-800"
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 max-w-xs truncate text-gray-500" title={apt.triageNote || "None"}>
                      {apt.triageNote || apt.notes || "-"}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        {apt.status === "Scheduled" && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const promptDt = prompt("Enter new reschedule parameters (YYYY-MM-DDTHH:MM):", apt.dateTime);
                                if (promptDt) onRescheduleAppointment(apt.id, promptDt);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-650 font-semibold px-2 py-1 rounded transition text-[10px] cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Cancel this consultation block?")) onCancelAppointment(apt.id);
                              }}
                              className="text-rose-600 hover:text-rose-700 bg-rose-50 font-bold px-2.5 py-1 rounded transition text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {onDeleteAppointment && (
                          <button
                            type="button"
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 font-bold px-2 py-1 rounded transition text-[10px] cursor-pointer"
                            title="Delete Appointment Record"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
