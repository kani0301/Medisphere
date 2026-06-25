import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Patient, Appointment, Invoice, Doctor } from "../types";
import { TrendingUp, Users, DollarSign, Activity, Calendar } from "lucide-react";

interface AnalyticsPanelProps {
  patients: Patient[];
  appointments: Appointment[];
  invoices: Invoice[];
  doctors: Doctor[];
}

export default function AnalyticsPanel({ patients, appointments, invoices, doctors }: AnalyticsPanelProps) {
  // Aggregate revenue analysis
  const totalGross = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = totalGross - totalPaid;

  // Department Distribution for Chart
  const departmentCounts: Record<string, number> = {};
  doctors.forEach(doc => {
    departmentCounts[doc.department] = (departmentCounts[doc.department] || 0) + 1;
  });
  const departmentData = Object.keys(departmentCounts).map(dept => ({
    name: dept,
    value: departmentCounts[dept],
    patients: appointments.filter(a => a.department === dept).length
  }));

  // Daily Appointment Load
  const appointmentDates: Record<string, number> = {};
  appointments.forEach(apt => {
    const day = apt.dateTime.split("T")[0];
    appointmentDates[day] = (appointmentDates[day] || 0) + 1;
  });
  const appointmentTimeline = Object.keys(appointmentDates).sort().map(date => ({
    date: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count: appointmentDates[date]
  }));

  // Patient Gender Breakdown
  const genders = { Male: 0, Female: 0, Other: 0 };
  patients.forEach(p => {
    if (p.gender === "Male") genders.Male++;
    else if (p.gender === "Female") genders.Female++;
    else genders.Other++;
  });
  const genderData = [
    { name: "Female", value: genders.Female, color: "#FB7185" }, // Warm Coral
    { name: "Male", value: genders.Male, color: "#2563EB" },   // Medical Blue
    { name: "Other", value: genders.Other, color: "#14B8A6" }   // Soft Teal
  ].filter(g => g.value > 0);

  // Status breakdown: Inpatient vs Outpatient
  const inpatientCount = patients.filter(p => p.status === "Inpatient").length;
  const outpatientCount = patients.filter(p => p.status === "Outpatient").length;
  const statusData = [
    { name: "Inpatient Status", value: inpatientCount, color: "#14B8A6" },
    { name: "Outpatient Status", value: outpatientCount, color: "#3B82F6" }
  ];

  // Colors
  const COLORS = ["#2563EB", "#14B8A6", "#FB7185", "#A855F7", "#F59E0B"];

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* Top Banner Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl shadow-xs border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Hospital Gross Billables</p>
              <h3 className="text-2xl font-bold text-blue-900 mt-1">${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-white rounded-xl text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-700">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Aggregate ledger items registered</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-2xl shadow-xs border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Total Received Payments</p>
              <h3 className="text-2xl font-bold text-teal-900 mt-1">${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-white rounded-xl text-teal-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-teal-700">
            <span>Insurance & card collections</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-5 rounded-2xl shadow-xs border border-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Outstanding Accounts</p>
              <h3 className="text-2xl font-bold text-rose-900 mt-1">${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-3 bg-white rounded-xl text-rose-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-rose-700">
            <span>Awaiting billing settlement</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-2xl shadow-xs border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Bed Occupancy Utilization</p>
              <h3 className="text-2xl font-bold text-teal-900 mt-1">
                {Math.round((inpatientCount / (patients.length || 1)) * 100)}%
              </h3>
            </div>
            <div className="p-3 bg-white rounded-xl text-teal-700">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-teal-800">
            <span>{inpatientCount} active inpatients admitted</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Appointments Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Daily Visit Allocations Timeline
          </h4>
          <div className="h-64">
            {appointmentTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No scheduled timeline dates.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentTimeline}>
                  <defs>
                    <linearGradient id="colorApt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F3F4F6", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="count" name="Appointments" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorApt)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Engagement load */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            Department Utilization & Consult Patient Counts
          </h4>
          <div className="h-64">
            {departmentData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No departments set.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #F3F4F6", fontSize: "11px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="value" name="Assigned Doctors" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="patients" name="Consultations Slotted" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Donut Demographic Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
            Patient Demographics (Gender)
          </h4>
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center mt-[-4px]">
              <div className="text-2xl font-bold text-gray-800">{patients.length}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Total Profiles</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-3">
            {genderData.map((g, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></span>
                <span className="text-gray-600">{g.name}: {g.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Inpatient/Outpatient Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
            Treatment Capacity Ratios
          </h4>
          <div className="h-44 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center mt-[-4px]">
              <div className="text-2xl font-bold text-gray-850">
                {patients.length > 0 ? Math.round((inpatientCount / patients.length) * 100) : 0}%
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Inpatient Share</div>
            </div>
          </div>
          <div className="flex justify-center gap-4 text-xs mt-3">
            {statusData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                <span className="text-gray-650">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Billing Summaries */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-sm font-semibold text-gray-850 uppercase tracking-widest mb-4">Financial Ledger Health</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Received Collections</span>
                <span className="text-emerald-600 font-bold">${totalPaid.toLocaleString()} / ${totalGross.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(totalPaid / (totalGross || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Pending Outstandings</span>
                <span className="text-amber-600 font-bold">${totalPending.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  style={{ width: `${(totalPending / (totalGross || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 mt-4">
              <p className="text-xs text-blue-900 leading-normal font-medium">
                ⚖️ <strong>Average invoice:</strong> ${(totalGross / (invoices.length || 1)).toFixed(2)} itemizing imaging, diagnostics workup, and outpatient drug supplies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
