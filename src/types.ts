export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'patient';
  department?: string;
  specialty?: string;
  room?: string;
  image?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  address: string;
  allergies: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  status: 'Inpatient' | 'Outpatient';
  admittedDate?: string;
  roomNumber?: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  department: string;
  specialty: string;
  phone: string;
  email: string;
  room: string;
  availability: {
    days: string[];
    hours: string;
  };
  image?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  dateTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  triageNote?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  diagnosedBy: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  prescription: string;
  labRecord?: string;
  reportUrl?: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  total: number;
  paidAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentMethod?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  role: string;
  read: boolean;
}
