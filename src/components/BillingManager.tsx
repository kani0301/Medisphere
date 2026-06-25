import React, { useState } from "react";
import { Invoice, Patient } from "../types";
import { DollarSign, FileDown, Plus, Trash2, CheckCircle2, AlertTriangle, Printer } from "lucide-react";

interface BillingManagerProps {
  patients: Patient[];
  invoices: Invoice[];
  onAddInvoice: (invoice: Omit<Invoice, "id" | "date" | "dueDate" | "total">) => void;
  onUpdateInvoiceStatus: (id: string, status: "Paid" | "Partially Paid" | "Unpaid", paidAmount: number) => void;
  onDeleteInvoice?: (id: string) => void;
  currentUser: any;
}

export default function BillingManager({ patients, invoices, onAddInvoice, onUpdateInvoiceStatus, onDeleteInvoice, currentUser }: BillingManagerProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [items, setItems] = useState<{ description: string; amount: number }[]>([]);
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [status, setStatus] = useState<"Paid" | "Partially Paid" | "Unpaid">("Unpaid");
  const [paidAmt, setPaidAmt] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddItem = () => {
    if (!desc.trim() || !amt.trim() || isNaN(parseFloat(amt))) {
      alert("Please provide an item description and a valid numerical amount.");
      return;
    }
    setItems([...items, { description: desc, amount: parseFloat(amt) }]);
    setDesc("");
    setAmt("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Please select a patient file.");
      return;
    }
    if (items.length === 0) {
      alert("Invoice must contain at least one itemized fee.");
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    onAddInvoice({
      patientId: selectedPatientId,
      patientName: patient.name,
      items,
      paidAmount: parseFloat(paidAmt) || 0,
      status,
      paymentMethod: paymentMethod || "Unspecified"
    });

    // Reset Form
    setSelectedPatientId("");
    setItems([]);
    setPaidAmt("");
    setPaymentMethod("");
    setStatus("Unpaid");
    setShowAddForm(false);
  };

  const handleDownloadInvoice = (inv: Invoice) => {
    alert(`Generating invoice breakdown for ${inv.patientName}... Saved onto medical billing queues. Ready to claim.`);
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" id="billing-manager">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 leading-tight">Patient Accounts & Financial Invoicing</h2>
          <p className="text-xs text-gray-500 mt-1">Itemize consulting, diagnostic, laboratory scans, and drug prescriptions on central ledger logs.</p>
        </div>
        {currentUser?.role !== "patient" && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Hide Invoice Panel" : "Issue New Invoice"}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmitInvoice} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            New Healthcare Itemized billing
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-750 mb-1">Select Patient File</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} [{p.id}]</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-750 mb-1">Receipt Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Fully Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-750 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose transaction --</option>
                  <option value="Insurance Claim">Insurance Claim</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Wire">Bank Wire</option>
                  <option value="Cash Payment">Cash Payment</option>
                </select>
              </div>
            </div>
          </div>

          {/* Itemizer Builder */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Construct Billable Line Items</h4>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Ex. Outpatient CT Scan fee"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="flex-1 text-xs py-2 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Ex. 180.00"
                value={amt}
                onChange={(e) => setAmt(e.target.value)}
                className="w-full sm:w-28 text-xs py-2 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl"
              >
                + Add Line
              </button>
            </div>

            {items.length > 0 && (
              <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-200/50 max-h-44 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-xs">
                    <span className="text-gray-800 font-medium">{it.description}</span>
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="text-gray-900">${it.amount.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 hover:bg-gray-100 text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-xs pt-2.5 pr-2">
                  <span>Simulated Total Amount:</span>
                  <span className="text-emerald-650">${items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {status === "Partially Paid" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Downpayment Paid ($)</label>
                <input
                  type="number"
                  placeholder="Ex. 450.00"
                  value={paidAmt}
                  onChange={(e) => setPaidAmt(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-250 text-xs font-semibold rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 shadow-xs"
            >
              Commit Bill to Ledger
            </button>
          </div>
        </form>
      )}

      {/* Invoice Listing histories */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Invoice History Lodger</h3>
          <input
            type="text"
            placeholder="Search by patient, invoice ID, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3.5 py-1.5 focus:border-blue-600 bg-white border border-gray-200 rounded-lg max-w-xs focus:outline-hidden"
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No invoicing records found match.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/40 text-[10px] text-gray-450 uppercase tracking-wider border-b border-gray-100 font-bold">
                  <th className="py-3 px-5">Invoice ID</th>
                  <th className="py-3 px-5">Patient Name</th>
                  <th className="py-3 px-5">Date Created</th>
                  <th className="py-3 px-5">Amount Due</th>
                  <th className="py-3 px-5 text-right">Settled Amount</th>
                  <th className="py-3 px-5 text-center">Receipt Status</th>
                  <th className="py-3 px-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const balance = inv.total - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/30 transition">
                      <td className="py-3.5 px-5 font-bold font-mono text-gray-800">{inv.id}</td>
                      <td className="py-3.5 px-5 font-semibold text-gray-900">{inv.patientName}</td>
                      <td className="py-3.5 px-5 text-gray-500 font-medium">{inv.date}</td>
                      <td className="py-3.5 px-5 font-bold text-gray-950">${inv.total.toFixed(2)}</td>
                      <td className="py-3.5 px-5 font-semibold text-emerald-700 text-right">${inv.paidAmount.toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-block text-[10px] uppercase font-bold py-1 px-2.5 rounded-full ${
                          inv.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                          inv.status === "Partially Paid" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-rose-50 text-rose-700 border border-rose-100"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          {currentUser?.role !== "patient" && inv.status !== "Paid" && (
                            <button
                              type="button"
                              onClick={() => {
                                const pay = confirm(`Settle upcoming balance of $${balance.toFixed(2)} for ${inv.patientName}?`);
                                if (pay) {
                                  onUpdateInvoiceStatus(inv.id, "Paid", inv.total);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition cursor-pointer"
                            >
                              Settle balance
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(inv)}
                            className="p-1 hover:bg-gray-150 text-gray-650 rounded border border-gray-100 cursor-pointer"
                            title="Generate print breakdown"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteInvoice && currentUser?.role !== "patient" && (
                            <button
                              type="button"
                              onClick={() => onDeleteInvoice(inv.id)}
                              className="p-1 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded border border-rose-100 bg-rose-50 cursor-pointer"
                              title="Delete Invoice Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
