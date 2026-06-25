import React, { useState } from "react";
import { MedicalRecord, Patient } from "../types";
import { FileText, Plus, Database, Sparkles, AlertCircle, Eye, Activity } from "lucide-react";

interface MedicalRecordsManagerProps {
  patients: Patient[];
  records: MedicalRecord[];
  onAddRecord: (record: Omit<MedicalRecord, "id">) => void;
  onDeleteRecord?: (id: string) => void;
  currentUser: any;
}

export default function MedicalRecordsManager({ patients, records, onAddRecord, onDeleteRecord, currentUser }: MedicalRecordsManagerProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [labRecord, setLabRecord] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // AI states
  const [aiSummaryId, setAiSummaryId] = useState<string | null>(null);
  const [aiSummaryText, setAiSummaryText] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const activeRecords = records.filter(rec => 
    rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.diagnosedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis.trim()) {
      alert("Please select a patient and fill in diagnostic conclusions.");
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    onAddRecord({
      patientId: selectedPatientId,
      patientName: patient.name,
      date: new Date().toISOString().split("T")[0],
      diagnosedBy: currentUser?.name || "Dr. Staff On-Call",
      diagnosis,
      symptoms,
      treatment,
      prescription,
      labRecord
    });

    // Reset Form
    setDiagnosis("");
    setSymptoms("");
    setTreatment("");
    setPrescription("");
    setLabRecord("");
    setShowAddForm(false);
  };

  async function requestClinicalAISummary(rec: MedicalRecord) {
    setLoadingAI(true);
    setAiSummaryId(rec.id);
    setAiSummaryText("");
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
      const data = await resp.json();
      setAiSummaryText(data.summary);
    } catch (err) {
      console.error(err);
      setAiSummaryText("Failed to retrieve smart summary details. Check internet connectivity.");
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="space-y-6" id="medical-records">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Clinical Diagnostic Ledger</h2>
          <p className="text-xs text-gray-500 mt-1">Manage physical diagnoses, active prescriptions, and laboratory scan records securely.</p>
        </div>
        {currentUser?.role !== "patient" && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Hide Intake Console" : "New Diagnostic Entry"}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 tracking-wide pb-2 border-b border-gray-50 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Log New Clinical Diagnostic Finding
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
                <option value="">-- Choose active patient profile --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} [{p.id}]</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Diagnosis Conclusions</label>
              <input
                type="text"
                placeholder="Ex. Lyme Relapse / Hypertensive Pre-eclampsia"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Presented Symptoms</label>
              <textarea
                placeholder="Ex. Sporadic limb paresthesis, cyclical headaches, fatigue..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment Protocol Details</label>
              <textarea
                placeholder="Ex. 14 Days intravenous drip, daily physiotherapy monitoring..."
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Medication Prescriptions (Drug specs & dosage schedules)</label>
              <textarea
                placeholder="Ex. 1. Doxycycline 100mg orally twice daily for 14 Days"
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 font-mono">Laboratory Reports & Imaging Findings</label>
              <textarea
                placeholder="Ex. Lyme ELISA assay: index 1.12. Brain MRI scan displays non-specific white matter dots..."
                value={labRecord}
                onChange={(e) => setLabRecord(e.target.value)}
                className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 h-20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
            >
              Commit Diagnostic Record
            </button>
          </div>
        </form>
      )}

      {/* Roster list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-blue-600" />
            Patient Clinical History Logs
          </h3>
          <input
            type="text"
            placeholder="Search by diagnosis, patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3.5 py-1.5 focus:border-blue-600 bg-white border border-gray-200 rounded-lg max-w-xs focus:outline-hidden"
          />
        </div>

        {activeRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No diagnostic charts found matching query parameters.
          </div>
        ) : (
          <div className="divide-y divide-gray-150">
            {activeRecords.map((rec) => (
              <div key={rec.id} className="p-5 hover:bg-gray-50/20 transition space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-950">{rec.patientName}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                      ID: {rec.patientId} • Date: {rec.date} • Staff: {rec.diagnosedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => requestClinicalAISummary(rec)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 hover:from-blue-100 hover:to-indigo-100 text-[11px] font-bold text-blue-700 rounded-lg transition duration-150 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                      Gemini AI Clinical Translation
                    </button>
                    {onDeleteRecord && currentUser?.role !== "patient" && (
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        className="px-3 py-1.5 text-rose-650 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-150 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Delete Medical Record"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mt-2">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 grid content-between">
                    <div>
                      <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block">Diagnosis Conclusion</span>
                      <p className="text-gray-900 font-semibold mt-1.5 text-xs inline-block leading-tight">{rec.diagnosis}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 grid content-between">
                    <div>
                      <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block">Presented Symptoms</span>
                      <p className="text-gray-700 mt-1.5 leading-relaxed">{rec.symptoms}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 grid content-between">
                    <div>
                      <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block">Prescriptions Issued</span>
                      <p className="text-gray-700 mt-1.5 whitespace-pre-line font-mono text-[11px] leading-relaxed">{rec.prescription || "None logged"}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 grid content-between col-span-1">
                    <div>
                      <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest block">Lab Reports / MRI findings</span>
                      <p className="text-gray-700 mt-1.5 leading-relaxed font-mono text-[11px]">{rec.labRecord || "No diagnostics attached."}</p>
                    </div>
                  </div>
                </div>

                {/* AI Summary Section */}
                {aiSummaryId === rec.id && (
                  <div className="bg-blue-50 border border-blue-100/50 p-4.5 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      Gemini Clinical Evaluation summary
                    </div>
                    {loadingAI ? (
                      <div className="flex items-center gap-2 text-xs text-blue-600 py-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Generating natural translation summary...
                      </div>
                    ) : (
                      <p className="text-xs text-blue-950 select-text leading-relaxed whitespace-pre-line font-medium p-0.5">{aiSummaryText}</p>
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
