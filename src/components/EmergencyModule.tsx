import { useState } from "react";
import { AlertCircle, ShieldAlert, Phone, Send, ArrowRight, CheckCircle2, User, Flame } from "lucide-react";

interface OnCallDoctor {
  name: string;
  department: string;
  status: "Available" | "In Surgery" | "On Call";
  phone: string;
}

export default function EmergencyModule() {
  const [onCallDocs, setOnCallDocs] = useState<OnCallDoctor[]>([
    { name: "Dr. Gregory House", department: "Diagnostics & Neurology", status: "Available", phone: "Ex: 4022" },
    { name: "Dr. Robert Chase", department: "Cardiology", status: "In Surgery", phone: "Ex: 1085" },
    { name: "Dr. Allison Cameron", department: "Immunology", status: "On Call", phone: "Ex: 3012" }
  ]);

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [alertReason, setAlertReason] = useState("");
  const [alertsHistory, setAlertsHistory] = useState([
    { id: "1", code: "Code Blue", r: "Patient bradycardic in ICU Ward B", t: "04:30 AM", status: "Addressed" },
    { id: "2", code: "Code Red", r: "Slight boiler exhaust vapor warning West Wing", t: "01:15 AM", status: "Addressed" }
  ]);

  const handlePageDoctor = (docName: string) => {
    alert(`Pager alert dispatched to ${docName}. Confirm receipt at West clinical nurses desk.`);
  };

  const triggerEmergencyAlert = (codeType: string) => {
    if (!alertReason.trim()) {
      alert("Please specify the localized ward or emergency details.");
      return;
    }
    const newAlert = {
      id: Date.now().toString(),
      code: codeType,
      r: alertReason,
      t: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      status: "Active Dispatch"
    };

    setAlertsHistory([newAlert, ...alertsHistory]);
    setActiveCode(codeType);
    setAlertReason("");
    setTimeout(() => {
      setActiveCode(null);
    }, 6000);
  };

  return (
    <div className="space-y-6" id="emergency-module">
      {/* Active Code Trigger Banner */}
      {activeCode && (
        <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">{activeCode} DISPATCHED</h2>
              <p className="text-sm opacity-90 mt-0.5">Emergency response team notified. Clear priority corridors immediately.</p>
            </div>
          </div>
          <Flame className="w-10 h-10 animate-spin text-white opacity-70" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Activation Panel */}
        <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-gray-900">Hospital Emergency Code Dispatch</h3>
          </div>
          <p className="text-xs text-gray-650 leading-relaxed mb-4">
            Immediately trigger emergency alerts. Action propagates warnings to pagers, security monitors, on-call physicians, and main receptionist desks.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">Emergency Note & Facility Room location</label>
              <input
                type="text"
                placeholder="Ex. Ward B Bed 3 - Cardiac arrest / Dyspnea critical"
                value={alertReason}
                onChange={(e) => setAlertReason(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => triggerEmergencyAlert("Code Blue")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition duration-150 flex flex-col items-center justify-center gap-1 shadow-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                Code Blue (Cardiac)
              </button>
              <button
                type="button"
                onClick={() => triggerEmergencyAlert("Code Red")}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition duration-150 flex flex-col items-center justify-center gap-1 shadow-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                Code Red (Fire)
              </button>
              <button
                type="button"
                onClick={() => triggerEmergencyAlert("Code Pink")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition duration-150 flex flex-col items-center justify-center gap-1 shadow-xs col-span-2 sm:col-span-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
                Code Pink (Triage)
              </button>
            </div>
          </div>

          {/* Incident Feed */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Today's Dispatches</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {alertsHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase text-white ${
                      item.code.includes("Blue") ? "bg-blue-600" : item.code.includes("Pink") ? "bg-purple-600" : "bg-rose-600"
                    }`}>
                      {item.code}
                    </span>
                    <div>
                      <p className="text-gray-950 font-medium">{item.r}</p>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">{item.t}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.status === "Addressed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800 animate-pulse"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* On-Call Doctors Board & Quick Paging */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-600">
              <Phone className="w-5 h-5 animate-bounce" />
              <h3 className="font-bold text-gray-950">On-Call Paging Console</h3>
            </div>
            <p className="text-xs text-gray-650 leading-relaxed mb-4">
              Select available critical specialists and dispatch a persistent pager warning tone.
            </p>

            <div className="space-y-3">
              {onCallDocs.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 hover:bg-gray-50/50 rounded-xl border border-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900">{doc.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{doc.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      doc.status === "Available" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                      doc.status === "In Surgery" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                      "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {doc.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageDoctor(doc.name)}
                      className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                      title="Page doctor"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-100/70 rounded-xl mt-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-900">Direct Emergency Hotline (Main Ward)</h5>
                <p className="text-[11px] text-rose-700 mt-1 uppercase tracking-wider font-extrabold">+1 (800) 911-CRIT / Direct Ext: 9999</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
