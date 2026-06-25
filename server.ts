import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Lazy Google GenAI initialization helper
let _aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!_aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.includes("MY_GEMINI_API_KEY")) {
      console.warn("GEMINI_API_KEY is not configured or uses placeholder. Falling back to simulated clinical intelligence.");
      return null;
    }
    try {
      _aiClient = new GoogleGenAI({
        apiKey: key,
      });
    } catch (e) {
      console.error("Failed to initialize Google GenAI client:", e);
      return null;
    }
  }
  return _aiClient;
}

// Helper to query Gemini API with transient error retries (503 / 429 / high demand)
async function callGeminiWithRetry(
  params: { model: string; contents: any; config?: any },
  retries = 2,
  delayMs = 400
): Promise<any> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini client not initialized");
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      const errStr = String(err?.message || err || "");
      const isTransient = 
        err?.status === "UNAVAILABLE" || 
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.statusCode === 503 || 
        err?.statusCode === 429 ||
        errStr.includes("503") || 
        errStr.includes("429") ||
        errStr.includes("UNAVAILABLE") ||
        errStr.includes("high demand") ||
        errStr.includes("limit");

      if (isTransient && attempt <= retries) {
        console.log(`Gemini API busy (attempt ${attempt}/${retries + 1}). Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2;
        continue;
      }
      throw err;
    }
  }
}

// Read and Write Helpers for db.json
const ORIGINAL_SEED = {
  users: [
    {
      id: "U-ADMIN",
      email: "admin@smarthospital.org",
      password: "password123",
      name: "Sarah Jenkins",
      role: "admin",
      department: "Administration"
    },
    {
      id: "U-DR-HOUSE",
      email: "house@smarthospital.org",
      password: "password123",
      name: "Dr. Gregory House",
      role: "doctor",
      department: "Diagnostics & Neurology",
      specialty: "Neurology & Infectious Diseases",
      room: "Clinic Tower A - Room 402",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=260"
    },
    {
      id: "U-DR-CHASE",
      email: "chase@smarthospital.org",
      password: "password123",
      name: "Dr. Robert Chase",
      role: "doctor",
      department: "Cardiology",
      specialty: "Interventional Cardiology",
      room: "Cardio Care Hall - Room 108",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=260"
    },
    {
      id: "U-DR-CAMERON",
      email: "cameron@smarthospital.org",
      password: "password123",
      name: "Dr. Allison Cameron",
      role: "doctor",
      department: "Immunology",
      specialty: "Clinical Immunology",
      room: "West Wing - Lab 3B",
      image: "https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=260"
    },
    {
      id: "U-RECE-01",
      email: "reception@smarthospital.org",
      password: "password123",
      name: "Clara Oswald",
      role: "receptionist",
      department: "Main Reception Desk"
    },
    {
      id: "U-PAT-ALICE",
      email: "alice@gmail.com",
      password: "password123",
      name: "Alice Cooper",
      role: "patient",
      phone: "+1 (555) 381-1902",
      dob: "1988-04-12",
      gender: "Female",
      bloodGroup: "A+",
      address: "402 Maplewood Dr, Springfield",
      allergies: "Penicillin, Strawberries"
    }
  ],
  patients: [
    {
      id: "PAT-001",
      name: "Alice Cooper",
      email: "alice@gmail.com",
      phone: "+1 (555) 381-1902",
      dob: "1988-04-12",
      gender: "Female",
      bloodGroup: "A+",
      address: "402 Maplewood Dr, Springfield",
      allergies: "Penicillin, Strawberries",
      emergencyContact: {
        name: "Marc Cooper",
        relation: "Spouse",
        phone: "+1 (555) 902-1234"
      },
      status: "Inpatient",
      admittedDate: "2026-06-12",
      roomNumber: "Beds Unit B-3"
    },
    {
      id: "PAT-002",
      name: "Bruce Gotham",
      email: "bruce@waynecorp.com",
      phone: "+1 (555) 911-0077",
      dob: "1979-11-20",
      gender: "Male",
      bloodGroup: "O-",
      address: "Wayne Manor, Gotham City",
      allergies: "None",
      emergencyContact: {
        name: "Alfred Pennyworth",
        relation: "Guardian",
        phone: "+1 (555) 123-4567"
      },
      status: "Outpatient",
      admittedDate: "",
      roomNumber: ""
    },
    {
      id: "PAT-003",
      name: "Clara Oswald",
      email: "clara@tardis.net",
      phone: "+1 (555) 777-1845",
      dob: "1994-06-03",
      gender: "Female",
      bloodGroup: "AB+",
      address: "77 London Road, Blackpool",
      allergies: "Sulfa drugs",
      emergencyContact: {
        name: "Danny Pink",
        relation: "Partner",
        phone: "+1 (555) 441-2019"
      },
      status: "Inpatient",
      admittedDate: "2026-06-18",
      roomNumber: "ICU Bed 4"
    },
    {
      id: "PAT-004",
      name: "David Tennant",
      email: "david@scotland.co.uk",
      phone: "+1 (555) 321-4567",
      dob: "1971-04-18",
      gender: "Male",
      bloodGroup: "B-",
      address: "10 Tardis Lane, Cardiff",
      allergies: "Peanuts",
      emergencyContact: {
        name: "Georgia Tennant",
        relation: "Spouse",
        phone: "+1 (555) 890-4321"
      },
      status: "Outpatient",
      admittedDate: "",
      roomNumber: ""
    }
  ],
  doctors: [
    {
      id: "DR-001",
      userId: "U-DR-HOUSE",
      name: "Dr. Gregory House",
      department: "Diagnostics & Neurology",
      specialty: "Neurology & Infectious Diseases",
      phone: "+1 (555) 444-1234",
      email: "house@smarthospital.org",
      room: "Clinic Tower A - Room 402",
      availability: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        hours: "10:00 AM - 04:00 PM"
      },
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=260"
    },
    {
      id: "DR-002",
      userId: "U-DR-CHASE",
      name: "Dr. Robert Chase",
      department: "Cardiology",
      specialty: "Interventional Cardiology",
      phone: "+1 (555) 444-5678",
      email: "chase@smarthospital.org",
      room: "Cardio Care Hall - Room 108",
      availability: {
        days: ["Monday", "Wednesday", "Friday"],
        hours: "08:30 AM - 02:00 PM"
      },
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=260"
    },
    {
      id: "DR-003",
      userId: "U-DR-CAMERON",
      name: "Dr. Allison Cameron",
      department: "Immunology",
      specialty: "Clinical Immunology",
      phone: "+1 (555) 444-9012",
      email: "cameron@smarthospital.org",
      room: "West Wing - Lab 3B",
      availability: {
        days: ["Tuesday", "Thursday", "Friday"],
        hours: "09:00 AM - 05:00 PM"
      },
      image: "https://images.unsplash.com/photo-1594824813573-246434e33963?auto=format&fit=crop&q=80&w=260"
    }
  ],
  appointments: [
    {
      id: "APT-101",
      patientId: "PAT-001",
      patientName: "Alice Cooper",
      doctorId: "DR-001",
      doctorName: "Dr. Gregory House",
      department: "Diagnostics & Neurology",
      dateTime: "2026-06-19T10:00:00",
      status: "Completed",
      notes: "Follow-up consultation regarding unexplained neurological shocks.",
      triageNote: "Blood pressure slightly high. Reports sporadic pins-and-needles sensation in hands."
    },
    {
      id: "APT-102",
      patientId: "PAT-002",
      patientName: "Bruce Gotham",
      doctorId: "DR-002",
      doctorName: "Dr. Robert Chase",
      department: "Cardiology",
      dateTime: "2026-06-20T09:30:00",
      status: "Scheduled",
      notes: "Stress testing echo post physical exertion and recovery evaluation.",
      triageNote: "Superb heart rate recovery. Mild joint pain reported."
    },
    {
      id: "APT-103",
      patientId: "PAT-003",
      patientName: "Clara Oswald",
      doctorId: "DR-003",
      doctorName: "Dr. Allison Cameron",
      department: "Immunology",
      dateTime: "2026-06-19T14:15:00",
      status: "Completed",
      notes: "Immunology workup and allergy re-evaluation report analysis.",
      triageNote: "Post-hypereosinophilic syndrome recovery checks."
    }
  ],
  medicalRecords: [
    {
      id: "REC-501",
      patientId: "PAT-001",
      patientName: "Alice Cooper",
      date: "2026-06-12",
      diagnosedBy: "Dr. Gregory House",
      diagnosis: "Early Stage Relapsing-Remitting Neuropathy secondary to Lyme Exposure",
      symptoms: "Numbness, localized paresthesia, mild visual visual field blurring for 30 minutes, intermittent low-back ache.",
      treatment: "14-day intensive protocol of Doxycycline combined with neurological sensory physical rehab. Re-evaluate serum levels in 10 days.",
      prescription: "1. Doxycycline Hyclate 100mg orally twice direct daily (14 Days)\n2. Gabapentin 300mg orally nightly as needed for pain (30 Days)",
      labRecord: "Lyme ELISA: Borderline Positive (1.12 index). Brain MRI: Occasional small non-specific scattered focal white matter lesions."
    },
    {
      id: "REC-502",
      patientId: "PAT-003",
      patientName: "Clara Oswald",
      date: "2026-06-18",
      diagnosedBy: "Dr. Allison Cameron",
      diagnosis: "Acute Allergic Hypereosinophilic Syndrome",
      symptoms: "Systemic purpuric macules, dyspnea, sudden wheezing, and skin pruritus immediately following undisclosed compound contact.",
      treatment: "Continuous intravenous drip of Methylprednisolone (Solumedrol). Antihistamines as scheduled. Monitored in High Dependency Unit on oxygen support.",
      prescription: "1. Methylprednisolone 40mg IV every 8 hours\n2. Fexofenadine 180mg once daily orally\n3. Albuterol Inhaler (Ventolin) - 2 puffs every 4 hours as needed",
      labRecord: "Complete Blood Count: White Blood Cells (WBC) 14,200/mcL with 35% absolute eosinophilia (Eos count 4,970/mcL). IgE levels significantly elevated at 480 IU/mL."
    }
  ],
  invoices: [
    {
      id: "INV-201",
      patientId: "PAT-001",
      patientName: "Alice Cooper",
      date: "2026-06-12",
      dueDate: "2026-06-26",
      items: [
        { description: "Diagnostics Department Specialist Consultation Fee", amount: 250 },
        { description: "Lyme Serum Antibody Multipanel Lab Test", amount: 180 },
        { description: "Brain MRI Scan (3-Tesla Neuro Suite)", amount: 1200 },
        { description: "Pharmacy Supply - Doxycycline and Gabapentin", amount: 85 }
      ],
      total: 1715,
      paidAmount: 1715,
      status: "Paid",
      paymentMethod: "Insurance Claim (Cigna Healthcare)"
    }
  ],
  notifications: [
    {
      id: "NTF-001",
      title: "Database Reset Completed",
      message: "Rich diagnostic registries restored automatically. System ready for audit trial presentations.",
      timestamp: new Date().toISOString(),
      role: "all",
      read: false
    }
  ]
};

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(ORIGINAL_SEED, null, 2), "utf-8");
      return JSON.parse(JSON.stringify(ORIGINAL_SEED));
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Safety check: ensure we always have doctors and default users seeded
    let needsUpdate = false;
    if (!parsed.doctors || parsed.doctors.length === 0) {
      parsed.doctors = JSON.parse(JSON.stringify(ORIGINAL_SEED.doctors));
      needsUpdate = true;
    }
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = JSON.parse(JSON.stringify(ORIGINAL_SEED.users));
      needsUpdate = true;
    }
    if (needsUpdate) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
    }
    return parsed;
  } catch (err) {
    console.error("Failed to read database:", err);
    return JSON.parse(JSON.stringify(ORIGINAL_SEED));
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to database:", err);
  }
}

// -------------------------------------------------------------
// System Management / Database Seeding & Slate Controls
// -------------------------------------------------------------
app.post("/api/system/clear", (req, res) => {
  const db = readDB();
  
  // Clear lists to start completely fresh
  // Keep the registered users so they don't get logged out!
  db.patients = [];
  db.appointments = [];
  db.medicalRecords = [];
  db.invoices = [];
  db.notifications = [
    {
      id: `NTF-${Date.now()}`,
      title: "System Scrub Completed",
      message: "All medical trials, diagnosis charts, ledger bills, and visits have been archived. Safe to create fresh entries.",
      timestamp: new Date().toISOString(),
      role: "all",
      read: false
    }
  ];

  // Auto-onboard existing users into empty patient structures if they are patients
  db.users.forEach((u: any) => {
    if (u.role === "patient" && !db.patients.some((p: any) => p.email === u.email)) {
      db.patients.push({
        id: `PAT-${Math.floor(100 + Math.random() * 900)}`,
        name: u.name,
        email: u.email,
        phone: u.phone || "+1 (555) 000-0000",
        dob: u.dob || "1994-01-01",
        gender: u.gender || "Not Specified",
        bloodGroup: u.bloodGroup || "O+",
        address: u.address || "Draft File",
        allergies: u.allergies || "",
        emergencyContact: {
          name: "None",
          relation: "Emergency Room",
          phone: "+1 (555) 999-9999"
        },
        status: "Outpatient",
        admittedDate: "",
        roomNumber: ""
      });
    }
  });

  writeDB(db);
  res.json({ message: "Clinical database scrubbed successfully. Now operating on a fresh clean-slate database." });
});

app.post("/api/system/reset", (req, res) => {
  // Keep any users who are not in the predefined ORIGINAL_SEED list, so we do not lose accounts custom-created by our active user (like 'kani')
  const currentDB = readDB();
  const originalSeedEmails = ORIGINAL_SEED.users.map((u: any) => u.email.toLowerCase());
  const customUsers = currentDB.users.filter((u: any) => !originalSeedEmails.includes(u.email.toLowerCase()));
  
  const mergedDB = {
    ...ORIGINAL_SEED,
    users: [...ORIGINAL_SEED.users, ...customUsers]
  };

  // Ensure those custom users also have patient nodes if they are patients
  customUsers.forEach((u: any) => {
    if (u.role === "patient" && !mergedDB.patients.some((p: any) => p.email.toLowerCase() === u.email.toLowerCase())) {
      mergedDB.patients.push({
        id: `PAT-${Math.floor(100 + Math.random() * 900)}`,
        name: u.name,
        email: u.email,
        phone: u.phone || "+1 (555) 000-0000",
        dob: u.dob || "1994-01-01",
        gender: u.gender || "Male",
        bloodGroup: u.bloodGroup || "O+",
        address: u.address || "Draft File",
        allergies: u.allergies || "",
        emergencyContact: {
          name: "None",
          relation: "Emergency Room",
          phone: "+1 (555) 999-9999"
        },
        status: "Outpatient",
        admittedDate: "",
        roomNumber: ""
      });
    }
  });

  writeDB(mergedDB);
  res.json({ message: "Mock records restored perfectly without deleting custom registered credentials." });
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password. Please use password 'password123' for demo users." });
  }
  
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    specialty: user.specialty,
    room: user.room
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, gender, phone, dob, bloodGroup, address, specialty, department } = req.body;
  const db = readDB();
  
  if (db.users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: "Email already registered." });
  }

  const userId = `U-${Date.now()}`;
  const newUser = {
    id: userId,
    email,
    password: password || "password123",
    name,
    role: role || "patient", 
    department: role === "patient" ? "" : (department || "General Medicine")
  };

  db.users.push(newUser);

  if (newUser.role === "patient") {
    const patientId = `PAT-${Math.floor(100 + Math.random() * 900)}`;
    const newPatient = {
      id: patientId,
      name,
      email,
      phone: phone || "+1 (555) 000-0000",
      dob: dob || "1990-01-01",
      gender: gender || "Male",
      bloodGroup: bloodGroup || "O+",
      address: address || "Not Specified",
      allergies: "None",
      emergencyContact: {
        name: "Not Specified",
        relation: "Spouse",
        phone: "+1 (555) 000-0000"
      },
      status: "Outpatient",
      admittedDate: "",
      roomNumber: ""
    };
    db.patients.push(newPatient);
    
    // Add Notification
    db.notifications.unshift({
      id: `NTF-${Date.now()}`,
      title: "New Patient Registered",
      message: `Patient ${name} is registered onto the system dashboard.`,
      timestamp: new Date().toISOString(),
      role: "all",
      read: false
    });
  } else if (newUser.role === "doctor") {
    const doctorId = `DR-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc = {
      id: doctorId,
      userId: userId,
      name,
      department: department || "General Medicine",
      specialty: specialty || "General Practitioner",
      phone: phone || "+1 (555) 000-0000",
      email,
      room: "Consultation Room 101",
      availability: {
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        hours: "09:00 AM - 05:00 PM"
      },
      image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=260"
    };
    db.doctors.push(newDoc);

    // Add Notification
    db.notifications.unshift({
      id: `NTF-${Date.now()}`,
      title: "New Specialist Onboarded",
      message: `${name} has been added to the active doctor roster as a ${newDoc.specialty} under ${newDoc.department}.`,
      timestamp: new Date().toISOString(),
      role: "all",
      read: false
    });
  } else if (newUser.role === "receptionist" || newUser.role === "admin") {
    // Add Notification for staff registration
    db.notifications.unshift({
      id: `NTF-${Date.now()}`,
      title: "New Staff Member Onboarded",
      message: `${name} has registered as a hospital ${newUser.role}.`,
      timestamp: new Date().toISOString(),
      role: "admin",
      read: false
    });
  }

  writeDB(db);
  res.status(201).json({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role
  });
});

// -------------------------------------------------------------
// Patients CRUD Endpoints
// -------------------------------------------------------------
app.get("/api/patients", (req, res) => {
  const db = readDB();
  res.json(db.patients);
});

app.post("/api/patients", (req, res) => {
  const db = readDB();
  const id = `PAT-${Math.floor(100 + Math.random() * 900)}`;
  const newPatient = {
    id,
    ...req.body,
    status: req.body.status || "Outpatient"
  };
  db.patients.push(newPatient);

  // Auto-generate notification for medical reception
  db.notifications.unshift({
    id: `NTF-${Date.now()}`,
    title: "New Patient Intake Completed",
    message: `Intake file completed for ${newPatient.name} [ID: ${id}]`,
    timestamp: new Date().toISOString(),
    role: "all",
    read: false
  });

  writeDB(db);
  res.status(201).json(newPatient);
});

app.put("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.patients.findIndex((p: any) => p.id === id);
  if (index === -1) return res.status(404).json({ message: "Patient not found." });

  db.patients[index] = { ...db.patients[index], ...req.body };
  writeDB(db);
  res.json(db.patients[index]);
});

app.delete("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.patients.findIndex((p: any) => p.id === id);
  if (index === -1) return res.status(404).json({ message: "Patient not found." });

  db.patients.splice(index, 1);
  writeDB(db);
  res.json({ message: "Patient file deleted successfully." });
});

// -------------------------------------------------------------
// Doctors CRUD Endpoints
// -------------------------------------------------------------
app.get("/api/doctors", (req, res) => {
  const db = readDB();
  res.json(db.doctors);
});

app.post("/api/doctors", (req, res) => {
  const db = readDB();
  const id = `DR-${Math.floor(100 + Math.random() * 900)}`;
  const newDoc = {
    id,
    ...req.body
  };
  db.doctors.push(newDoc);
  writeDB(db);
  res.status(201).json(newDoc);
});

app.put("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.doctors.findIndex((d: any) => d.id === id);
  if (index === -1) return res.status(404).json({ message: "Doctor not found." });

  db.doctors[index] = { ...db.doctors[index], ...req.body };
  writeDB(db);
  res.json(db.doctors[index]);
});

app.delete("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.doctors.findIndex((d: any) => d.id === id);
  if (index === -1) return res.status(404).json({ message: "Doctor not found." });

  db.doctors.splice(index, 1);
  writeDB(db);
  res.json({ message: "Doctor profile deleted successfully." });
});

// -------------------------------------------------------------
// Appointments Endpoints
// -------------------------------------------------------------
app.get("/api/appointments", (req, res) => {
  const db = readDB();
  res.json(db.appointments);
});

app.post("/api/appointments", (req, res) => {
  const db = readDB();
  const id = `APT-${Math.floor(100 + Math.random() * 900)}`;
  const newApt = {
    id,
    ...req.body,
    status: req.body.status || "Scheduled"
  };
  db.appointments.push(newApt);

  db.notifications.unshift({
    id: `NTF-${Date.now()}`,
    title: "Appointment Booked",
    message: `${newApt.patientName} scheduled with ${newApt.doctorName} for ${newApt.dateTime.replace('T', ' ')}`,
    timestamp: new Date().toISOString(),
    role: "all",
    read: false
  });

  writeDB(db);
  res.status(201).json(newApt);
});

app.put("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.appointments.findIndex((a: any) => a.id === id);
  if (index === -1) return res.status(404).json({ message: "Appointment not found." });

  db.appointments[index] = { ...db.appointments[index], ...req.body };
  
  if (req.body.status === "Cancelled") {
    db.notifications.unshift({
      id: `NTF-${Date.now()}`,
      title: "Appointment Cancelled",
      message: `Appointment ${id} for ${db.appointments[index].patientName} was cancelled.`,
      timestamp: new Date().toISOString(),
      role: "all",
      read: false
    });
  }

  writeDB(db);
  res.json(db.appointments[index]);
});

// -------------------------------------------------------------
// Medical Records Endpoints
// -------------------------------------------------------------
app.get("/api/records", (req, res) => {
  const db = readDB();
  res.json(db.medicalRecords);
});

app.post("/api/records", (req, res) => {
  const db = readDB();
  const id = `REC-${Math.floor(500 + Math.random() * 500)}`;
  const newRec = {
    id,
    ...req.body,
    date: req.body.date || new Date().toISOString().split('T')[0]
  };
  db.medicalRecords.push(newRec);

  db.notifications.unshift({
    id: `NTF-${Date.now()}`,
    title: "New Diagnosis Logged",
    message: `Clinical chart updated for ${newRec.patientName} with diagnosis: ${newRec.diagnosis}`,
    timestamp: new Date().toISOString(),
    role: "all",
    read: false
  });

  writeDB(db);
  res.status(201).json(newRec);
});

// -------------------------------------------------------------
// Billing / Invoices Endpoints
// -------------------------------------------------------------
app.get("/api/invoices", (req, res) => {
  const db = readDB();
  res.json(db.invoices);
});

app.post("/api/invoices", (req, res) => {
  const db = readDB();
  const id = `INV-${Math.floor(200 + Math.random() * 800)}`;
  const total = req.body.items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0);
  const newInv = {
    id,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days due
    ...req.body,
    total,
    paidAmount: req.body.status === "Paid" ? total : (req.body.paidAmount || 0)
  };
  db.invoices.push(newInv);

  db.notifications.unshift({
    id: `NTF-${Date.now()}`,
    title: "New Invoice Generated",
    message: `Healthcare ledger item ${id} issued to ${newInv.patientName} total $${total.toFixed(2)}`,
    timestamp: new Date().toISOString(),
    role: "admin",
    read: false
  });

  writeDB(db);
  res.status(201).json(newInv);
});

app.put("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.invoices.findIndex((iv: any) => iv.id === id);
  if (index === -1) return res.status(404).json({ message: "Invoice not found." });

  const total = req.body.items ? req.body.items.reduce((sum: number, item: any) => sum + parseFloat(item.amount), 0) : db.invoices[index].total;
  
  db.invoices[index] = { 
    ...db.invoices[index], 
    ...req.body,
    total
  };
  writeDB(db);
  res.json(db.invoices[index]);
});

app.delete("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.invoices.findIndex((iv: any) => iv.id === id);
  if (index === -1) return res.status(404).json({ message: "Invoice not found." });

  db.invoices.splice(index, 1);
  writeDB(db);
  res.json({ message: "Invoice deleted successfully." });
});

app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.appointments.findIndex((a: any) => a.id === id);
  if (index === -1) return res.status(404).json({ message: "Appointment not found." });

  db.appointments.splice(index, 1);
  writeDB(db);
  res.json({ message: "Appointment deleted successfully." });
});

app.delete("/api/records/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.medicalRecords.findIndex((mr: any) => mr.id === id);
  if (index === -1) return res.status(404).json({ message: "Medical record not found." });

  db.medicalRecords.splice(index, 1);
  writeDB(db);
  res.json({ message: "Medical record deleted successfully." });
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.users.findIndex((u: any) => u.id === id);
  if (index === -1) return res.status(404).json({ message: "User not found." });

  const deletedUser = db.users[index];
  db.users.splice(index, 1);

  // If doctor, also remove doctor record
  if (deletedUser.role === "doctor") {
    db.doctors = db.doctors.filter((d: any) => d.email.toLowerCase() !== deletedUser.email.toLowerCase());
  }
  // If patient, also remove patient record
  if (deletedUser.role === "patient") {
    db.patients = db.patients.filter((p: any) => p.email.toLowerCase() !== deletedUser.email.toLowerCase());
  }

  writeDB(db);
  res.json({ message: "User account and profile deleted successfully." });
});

// -------------------------------------------------------------
// Notifications Endpoints
// -------------------------------------------------------------
app.get("/api/notifications", (req, res) => {
  const db = readDB();
  res.json(db.notifications || []);
});

app.put("/api/notifications/read-all", (req, res) => {
  const db = readDB();
  if (db.notifications) {
    db.notifications.forEach((n: any) => n.read = true);
  }
  writeDB(db);
  res.json({ message: "All notifications marked as read." });
});

// -------------------------------------------------------------
// Google Gemini AI Powered Features
// -------------------------------------------------------------

// Helper to provide high-quality mock backup when Gemini API is unavailable or limits exceeded
const SIMULATED_SUMMARIES: Record<string, string> = {
  "PAT-001": `Alice Cooper's continuous Lyme neurological symptoms present primarily as localized paresthesia, sensory anomalies, and cyclical ocular-blur episodes. The clinical exposure warrants close surveillance. We advise completing the Doxycycline intake strictly as directed to neutralize underlying systemic spirochetes. Monitor her blood pressure twice daily to evaluate the mild hypertensive reading. Ensure she stays hydrated and undergoes daily low-impact physiotherapy for muscle tone/movement stabilization. Consider a brain MRI follow-up in six weeks to confirm that the occasional focal white matter spots remain stable and do not propagate further.`,
  "PAT-003": `Clara Oswald's episode represents an acute hypereosinophilic hypersensitivity storm characterized by intense dermatological and thoracic distress, indicating high cytokine storm activity. With absolute eosinophils sitting exceptionally high at 35%, continuous intravenous corticosteroids are critical to control multi-system inflammatory hazards. Next steps: gradually taper from continuous IV Methylprednisolone to oral Prednisone over a 10-day safety cycle. Track the heart for possible eosinophilic myocarditis signs. A formal outpatient allergy prick panel must be performed after symptoms calm down to pinpoint the triggering allergen, and the patient must carry an epinephrine autoinjector.`
};

// 1. Health Report Clinical Summaries
app.post("/api/ai/patient-summary", async (req, res) => {
  const { patientId, symptoms, diagnosis, treatment, prescription, labRecord } = req.body;
  const client = getGeminiClient();

  if (!client) {
    const backup = SIMULATED_SUMMARIES[patientId] || 
      `Clinical analysis for patient is active. Given symptoms (${symptoms || "unspecified"}) and active diagnosis (${diagnosis || "under testing"}), the patient is undergoing a standard clinical monitoring track. Current recommendations include: strict adherence to the prescribed treatment (${treatment || "as directed"}), ensuring immediate hydration, tracking vital statistics (especially blood pressure and pulse), and arranging an outpatient consultation with their primary care specialist within 7 days. Ensure patient remains clear of known allergy pathways.`;
    return res.json({ summary: backup, isSimulated: true });
  }

  try {
    const prompt = `You are a professional clinical assistant at Smart Hospital. Provide a concise, reassuring, yet highly technical clinical summary of the patient's condition.
    - Diagnosis: ${diagnosis}
    - Symptoms: ${symptoms}
    - Treatment Plan: ${treatment}
    - Prescriptions: ${prescription}
    - Laboratory/Imaging Data: ${labRecord}

    Provide guidelines on what to monitor, precautions to enforce, medication reminders, and outline when they should see a specialist again. Deliver exactly 2 neat paragraphs, using professional healthcare-grade vocabulary.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ summary: response.text || "Summary analysis parsed.", isSimulated: false });
  } catch (err: any) {
    console.log(`[Simulation Mode] Patient Summary fallback activated: ${err?.message || "busy"}`);
    res.json({ 
      summary: SIMULATED_SUMMARIES[patientId] || "Clinical telemetry shows general recovery status. Adhere to all current therapy protocols.", 
      isSimulated: true 
    });
  }
});

// 2. Main Hospital Smart Recommendations & Insights
app.get("/api/ai/hospital-insights", async (req, res) => {
  const db = readDB();
  const client = getGeminiClient();

  const patientCount = db.patients.length;
  const doctorCount = db.doctors.length;
  const aptCount = db.appointments.length;
  const grossRevenue = db.invoices.reduce((sum: number, u: any) => sum + u.total, 0);
  const pendingRevenue = db.invoices.filter((u: any) => u.status !== "Paid").reduce((sum: number, u: any) => sum + (u.total - u.paidAmount), 0);
  const diagnosticCount = db.medicalRecords.length;

  const dataString = `Stats: Total Patients: ${patientCount}, Doctors: ${doctorCount}, Appointments: ${aptCount}, Diagnoses Registered: ${diagnosticCount}, Gross Revenue: $${grossRevenue}, Pending Ledger Balance: $${pendingRevenue}. Admitted Inpatients: ${db.patients.filter((p: any) => p.status === 'Inpatient').length}.`;

  if (!client) {
    const backupRecommendations = [
      {
        category: "Resource Bottlenecks",
        title: "Main General Reception Triage Expansion",
        detail: `Current stats indicate ${patientCount} registered patients with high inpatient occupancy in Beds Unit B-3 and ICU Bed 4. Consider scheduling an extra nurse for Friday night rotations to streamline main desks.`
      },
      {
        category: "Clinical Readiness",
        title: "Elevated IgE & Eosinophil Trend Surveillance",
        detail: "With acute cases like Clara Oswald in focus, keep therapeutic corticosteroids (and antihistamine IV drip bundles) stocked in local Emergency Carts in the West wing."
      },
      {
        category: "Revenue & Ledger Optimization",
        title: "Cardiology Stress Test Balances",
        detail: `Unpaid balances currently aggregate to $${pendingRevenue.toFixed(2)}. Suggest sending automated billing notifications for unpaid cardiacstress checkups and insurance pre-approvals.`
      }
    ];
    return res.json({ recommendations: backupRecommendations, isSimulated: true });
  }

  try {
    const prompt = `You are a chief consultant or medical director advisor analyzing hospital records.
    Context Data: ${dataString}
    Please output 3 strategic, highly action-oriented hospital recommendations/insights based on this data.
    The categories must be "Resource Bottlenecks", "Clinical Readiness", and "Revenue & Ledger Optimization".
    Output the result STRICTLY as a valid JSON array of objects, where each object has:
    - category: string
    - title: string
    - detail: string
    
    Do not wrap in markdown quotes or code tags. Output pure raw JSON.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let resultText = (response.text || "").trim();
    if (resultText.startsWith("```json")) {
      resultText = resultText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (resultText.startsWith("```")) {
      resultText = resultText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(resultText);
    res.json({ recommendations: parsed, isSimulated: false });
  } catch (err: any) {
    console.log(`[Simulation Mode] Hospital Insights fallback activated: ${err?.message || "busy"}`);
    const backupRecommendations = [
      {
        category: "Resource Bottlenecks",
        title: "Main General Reception Triage Expansion",
        detail: `Current stats indicate ${patientCount} registered patients with high inpatient occupancy in Beds Unit B-3 and ICU Bed 4. Consider scheduling an extra nurse for Friday night rotations to streamline main desks.`
      },
      {
        category: "Clinical Readiness",
        title: "Elevated IgE & Eosinophil Trend Surveillance",
        detail: "With acute cases like Clara Oswald in focus, keep therapeutic corticosteroids (and antihistamine IV drip bundles) stocked in local Emergency Carts in the West wing."
      },
      {
        category: "Revenue & Ledger Optimization",
        title: "Cardiology Stress Test Balances",
        detail: `Unpaid balances currently aggregate to $${pendingRevenue.toFixed(2)}. Suggest sending automated billing notifications for unpaid cardiac stress checkups and insurance pre-approvals.`
      }
    ];
    res.json({ recommendations: backupRecommendations, isSimulated: true });
  }
});

// 3. Appointment Department Suggestions
app.post("/api/ai/appointment-suggestions", async (req, res) => {
  const { notes, triageNote } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.json({
      department: "Diagnostics & Neurology",
      urgency: "Medium",
      reason: "Based on unexplained neurological paresthesia reports. A specialist consult with Dr. Gregory House is highly recommended.",
      suggestedWindow: "Within 48 hours"
    });
  }

  try {
    const prompt = `Analyze patient complaints:
    - Reason: ${notes}
    - Vitals/Triage details: ${triageNote || "None recorded"}
    
    Choose the best medical department from: Cardiology, Diagnostics & Neurology, Immunology, General Medicine.
    Output a valid JSON object with:
    - department: recommended dept
    - urgency: "Low", "Medium", "High", or "Critical"
    - reason: concise explanation for your medical department suggestion
    - suggestedWindow: "Immediate", "Within 48 hours", "Next 7 Days", etc.
    Do not output markdown code blocks.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = (response.text || "").trim();
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    const result = JSON.parse(text);
    res.json(result);
  } catch (err: any) {
    console.log(`[Simulation Mode] Appointment Suggestions fallback activated: ${err?.message || "busy"}`);
    res.json({
      department: "General Medicine",
      urgency: "Medium",
      reason: "Routine clinical evaluation for symptomatic relief suggested.",
      suggestedWindow: "Next 7 Days"
    });
  }
});

// 4. Clinical Trend Analysis & Statistics
app.get("/api/ai/trend-analysis", async (req, res) => {
  const db = readDB();
  const client = getGeminiClient();

  const caseSummary = db.medicalRecords.map((m: any) => `- Diagnosis: ${m.diagnosis}, Symptoms: ${m.symptoms}`).join("\n");

  if (!client) {
    return res.json({
      trends: [
        { topic: "Infectious vector & Zoonotic spikes", count: 12, trendState: "Rising", advice: "Ensure prompt Doxycycline therapy is distributed immediately during high tick-activity summer seasons." },
        { topic: "Severe Immune Hyper-reactivity cases", count: 8, trendState: "Stagnant", advice: "Increase high-dose antihistamines and corticosteroids inventory backup across urgent supply zones." }
      ]
    });
  }

  try {
    const prompt = `Analyze current active diagnoses:
    ${caseSummary}
    
    Identify 2 key clinical trends, assigning a medical focus topic, case load estimates (e.g., 5-15 based on clinical context), trend state ("Rising", "Declining", "Stagnant"), and actionable clinical safety guidelines.
    Output strictly as a valid JSON array of objects with keys: topic, count (number), trendState, advice.`;

    const response = await callGeminiWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = (response.text || "").trim();
    if (text.startsWith("```json")) text = text.replace(/^```json/, "").replace(/```$/, "").trim();
    res.json({ trends: JSON.parse(text) });
  } catch (e: any) {
    console.log(`[Simulation Mode] Clinical Trend Analysis fallback activated: ${e?.message || "busy"}`);
    res.json({
      trends: [
        { topic: "Infectious vector & Zoonotic spikes", count: 12, trendState: "Rising", advice: "Ensure prompt Doxycycline therapy is distributed immediately during high tick-activity summer seasons." },
        { topic: "Severe Immune Hyper-reactivity cases", count: 8, trendState: "Stagnant", advice: "Increase high-dose antihistamines and corticosteroids inventory backup across urgent supply zones." }
      ]
    });
  }
});


// -------------------------------------------------------------
// Core Express SPA / Vite Middleware Integration
// -------------------------------------------------------------
async function startServer() {
  // Eagerly initialize/seed database on startup
  readDB();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Hospital Server running on http://localhost:${PORT}`);
  });
}

startServer();
