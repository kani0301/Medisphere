# Clinic & Hospital Management System (HMS)

A modern, full-stack, responsive hospital and clinic administration platform with dedicated dashboards for Patients, Doctors, Receptionists, and Administrators. This system enables streamlined appointment scheduling, staff coordination, diagnostic record entry, automated invoicing, and real-time, resilient client-backend state synchronization.

---

## 🚀 Key Features

### 👥 Role-Based Portals & Dashboards

*   **Patient Portal**
    *   **Clinical Booking Commit Ledger**: Dynamic, real-time appointment scheduler with active room allocation.
    *   **Interactive Medical History**: View detailed prescriptions, vital logs, and professional diagnostic records.
    *   **Staff Profiles**: View active clinic times, office numbers, specialties, and pictures of practitioners.
*   **Physician Portal**
    *   **Daily Clinical Rotations**: Dynamic timeline of today's scheduled, cancelled, or completed appointments.
    *   **Patient Intake Summary**: View patient symptoms, chief complaints, and historical medical conditions.
    *   **Clinic Profile Management**: Update office rooms, contact numbers, specialty summaries, and availability on the fly.
*   **Receptionist Portal**
    *   **Speed Intake & Check-In**: Rapid check-in workflow for arriving patients.
    *   **Appointment Management**: Full-calendar queue overview to manage patient triage seamlessly.
*   **Administrator Portal**
    *   **Staff Registry Management**: Add, delete, or update staff information and medical doctor credentials.
    *   **Hospital Metrics Overview**: Detailed reporting on gross billing ledgers, admitted inpatients, active staff counts, and clinical volume.

### ⚡ Technology Stack

*   **Frontend**: React (Vite, TypeScript, Tailwind CSS)
*   **Backend**: Node.js, Express, TypeScript (run with tsx)
*   **Durable Mock Database**: `db.json` file-based JSON database with automated initial seeding and clean, crash-resilient write backups.
*   **Resiliency**: Custom React fetch client with automatic exponential backoff retry logic and background state hydration to recover from intermittent network fluctuations.

---

## 🛠️ Project Structure

```text
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx       # System admin portal (staff, metrics)
│   │   ├── DoctorDashboard.tsx      # Clinic rotation, profile, record writing
│   │   ├── PatientDashboard.tsx     # Appointment booking, history, records
│   │   ├── ReceptionistDashboard.tsx# Dynamic queue check-ins & quick scheduling
│   │   ├── AISuggestionsTab.tsx     # Smart diagnostic intelligence visualizations
│   │   └── EmergencyModule.tsx      # Fast-action triage component
│   ├── App.tsx                      # Core React app container & state hydrator
│   ├── main.tsx                     # React entry-point
│   └── types.ts                     # Strict TypeScript interfaces and type schemas
├── server.ts                        # Full-stack Express REST API with mock database controller
├── db.json                          # JSON persistence layer representing the database
├── package.json                     # Dependency manifest and execution scripts
└── tsconfig.json                    # TypeScript compiler configuration
```

---

## ⚙️ Development & Build

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Run in Development Mode
Start the full-stack development server:
```bash
npm run dev
```
The server binds to port `3000` on `0.0.0.0`, running Vite middleware alongside the Express API endpoints.

### 3. Production Build
Compile both front-end and back-end modules:
```bash
npm run build
```
This produces a fully compiled and static asset-optimized build inside the `dist/` directory, including a bundled backend `dist/server.cjs` file designed for robust container environments.

### 4. Production Start
Run the compiled full-stack production application:
```bash
npm start
```

---

## 🔒 High-Availability State Synchronization

To ensure real-time clinical dashboards remain consistent across concurrent client browser sessions (e.g., when a patient registers an appointment and a receptionist needs to instantly see the intake update), the frontend implements:

1.  **Resilient Fetch Interface**: The wrapper function `fetchWithRetry` intercepts network operations, detecting packet drops or temporary server timeouts and automatically retrying the query up to 3 times with exponential backoff.
2.  **State Hydration Polling**: An automated, lightweight background polling timer synchronizes core clinical resources (patients, doctors, appointments, medical records, invoices) every 4 seconds to maintain a flawless single source of truth without full-page reloads.
