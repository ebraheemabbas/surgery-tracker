
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { z } from "zod";

import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './authRoutes.js';
import authRequired from './authRequired.js';

dotenv.config();



const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use('/api/auth', authRoutes);
//app.use('/api/patients', authRequired, patientsRouter);
//app.use('/api/surgeries', authRequired, surgeriesRouter);
//app.use(cors());
// --- DB setup ---
const db = new Database("./db.sqlite");
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth TEXT,
  sex TEXT,
  phone TEXT,
  email TEXT,
  allergies TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS surgeries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  type TEXT CHECK(type IN ('emergency','elective')) NOT NULL,
  status TEXT CHECK(status IN ('scheduled','successful','failed')) NOT NULL,
  datetime TEXT NOT NULL,
  duration_min INTEGER,
  surgeon TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(patient_id) REFERENCES patients(id)
);
CREATE INDEX IF NOT EXISTS idx_surgeries_patient_datetime ON surgeries(patient_id, datetime);
`);

// Seed sample data if empty
const countPatients = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
if (countPatients === 0) {
  const now = new Date().toISOString();
  const insertPatient = db.prepare(`INSERT INTO patients 
    (id, first_name, last_name, date_of_birth, sex, phone, email, allergies, created_at, updated_at)
    VALUES (@id, @first_name, @last_name, @dob, @sex, @phone, @email, @allergies, @created_at, @updated_at)`);

  const seedPatients = [
    { id: "p1", first_name: "John", last_name: "Doe", dob: "1985-04-12", sex: "M",
      phone: "555-0101", email: "john.doe@example.com", allergies: "Penicillin",
      created_at: now, updated_at: now },
    { id: "p2", first_name: "Anna", last_name: "Smith", dob: "1990-09-05", sex: "F",
      phone: "555-0102", email: "anna.smith@example.com", allergies: "",
      created_at: now, updated_at: now },
    { id: "p3", first_name: "Mark", last_name: "Wilson", dob: "1978-11-21", sex: "M",
      phone: "555-0103", email: "mark.wilson@example.com", allergies: "Latex",
      created_at: now, updated_at: now },
  ];
  const insertMany = db.transaction((rows)=> rows.forEach(r => insertPatient.run(r)));
  insertMany(seedPatients);

  const insertSurgery = db.prepare(`INSERT INTO surgeries
    (id, title, patient_id, type, status, datetime, duration_min, surgeon, notes, created_at, updated_at)
    VALUES (@id, @title, @patient_id, @type, @status, @datetime, @duration_min, @surgeon, @notes, @created_at, @updated_at)`);

  const seedSurgeries = [
    { id: "s1", title: "Appendectomy", patient_id: "p1", type: "emergency", status: "successful",
      datetime: "2024-01-20T09:00:00Z", duration_min: 75, surgeon: "Dr. Miller",
      notes: "successful with complications", created_at: now, updated_at: now },
    { id: "s2", title: "Inguinal Hernia Repair", patient_id: "p2", type: "elective", status: "successful",
      datetime: "2024-01-18T10:00:00Z", duration_min: 90, surgeon: "Dr. Wilson",
      notes: "", created_at: now, updated_at: now },
    { id: "s3", title: "Laparoscopic Cholecystectomy", patient_id: "p3", type: "elective", status: "successful",
      datetime: "2024-01-15T13:00:00Z", duration_min: 120, surgeon: "Dr. Anderson",
      notes: "", created_at: now, updated_at: now },
  ];
  const insertSMany = db.transaction((rows)=> rows.forEach(r => insertSurgery.run(r)));
  insertSMany(seedSurgeries);

  console.log("Seeded sample patients and surgeries.");
}

// --- Validation Schemas ---
const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  allergies: z.string().optional().nullable()
});

const surgerySchema = z.object({
  title: z.string().min(1),
  patientId: z.string().min(1),
  type: z.enum(['emergency','elective']),
  status: z.enum(['scheduled','successful','failed']),
  datetime: z.string().min(1),
  durationMin: z.number().int().nonnegative().optional().nullable(),
  surgeon: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

// --- Helpers ---
function nowISO(){ return new Date().toISOString(); }
function mapPatientRow(row){
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    phone: row.phone,
    email: row.email,
    allergies: row.allergies,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapSurgeryRow(row){
  return {
    id: row.id,
    title: row.title,
    patientId: row.patient_id,
    type: row.type,
    status: row.status,
    datetime: row.datetime,
    durationMin: row.duration_min,
    surgeon: row.surgeon,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// --- Stats endpoint ---
app.get('/', (req, res) => {
  res.send('Surgery Tracker API running. Try /api/stats');
});


app.get("/api/stats", (req,res)=>{
  const todayStr = new Date().toISOString().slice(0,10);
  const totalPatients = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
  const totalSurgeries = db.prepare("SELECT COUNT(*) as c FROM surgeries").get().c;
  const todaySurgeries = db.prepare("SELECT COUNT(*) as c FROM surgeries WHERE substr(datetime,1,10)=?").get(todayStr).c;
  const successCount = db.prepare("SELECT COUNT(*) as c FROM surgeries WHERE status='successful'").get().c;
  const successRate = totalSurgeries ? Math.round((successCount/totalSurgeries)*100) : 0;

  // recent surgeries (latest 10)
  const rows = db.prepare(`
    SELECT s.*, p.first_name, p.last_name
    FROM surgeries s JOIN patients p ON p.id = s.patient_id
    ORDER BY datetime DESC LIMIT 10
  `).all();

  const recent = rows.map(r => ({
    ...mapSurgeryRow(r),
    patientName: `${r.first_name} ${r.last_name}`
  }));

  res.json({ data: { totalPatients, totalSurgeries, todaySurgeries, successRate, recent } });
});

// --- Patients ---
app.get("/api/patients", (req,res)=>{
  const q = String(req.query.q || "").trim();
  let rows;
  if (q){
    rows = db.prepare(`SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ? OR id LIKE ? ORDER BY last_name ASC`)
      .all(`%${q}%`,`%${q}%`,`%${q}%`);
  } else {
    rows = db.prepare("SELECT * FROM patients ORDER BY last_name ASC").all();
  }
  res.json({ data: rows.map(mapPatientRow) });
});

app.get("/api/patients/:id", (req,res)=>{
  const row = db.prepare("SELECT * FROM patients WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ data: mapPatientRow(row) });
});

app.post("/api/patients", (req,res)=>{
  const parsed = patientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;
  const id = `p_${Math.random().toString(36).slice(2,9)}`;
  const now = nowISO();
  db.prepare(`INSERT INTO patients (id, first_name, last_name, date_of_birth, sex, phone, email, allergies, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, p.firstName, p.lastName, p.dateOfBirth || null, p.sex || null, p.phone || null, p.email || null, p.allergies || null, now, now);
  const row = db.prepare("SELECT * FROM patients WHERE id=?").get(id);
  res.status(201).json({ data: mapPatientRow(row) });
});

app.patch("/api/patients/:id", (req,res)=>{
  const existing = db.prepare("SELECT * FROM patients WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const parsed = patientSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = { ...mapPatientRow(existing), ...parsed.data };

  db.prepare(`UPDATE patients SET first_name=?, last_name=?, date_of_birth=?, sex=?, phone=?, email=?, allergies=?, updated_at=? WHERE id=?`)
    .run(p.firstName, p.lastName, p.dateOfBirth || null, p.sex || null, p.phone || null, p.email || null, p.allergies || null, nowISO(), req.params.id);

  const row = db.prepare("SELECT * FROM patients WHERE id=?").get(req.params.id);
  res.json({ data: mapPatientRow(row) });
});

// --- Surgeries ---
app.get("/api/surgeries", (req,res)=>{
  const { date_from, date_to, status, surgeon, patient_id } = req.query;
  let sql = `SELECT s.*, p.first_name, p.last_name FROM surgeries s 
             JOIN patients p ON p.id = s.patient_id WHERE 1=1`;
  const params = [];
  if (patient_id){ sql += " AND s.patient_id=?"; params.push(String(patient_id)); }
  if (status){ sql += " AND s.status=?"; params.push(String(status)); }
  if (surgeon){ sql += " AND s.surgeon LIKE ?"; params.push(`%${String(surgeon)}%`); }
  if (date_from){ sql += " AND s.datetime >= ?"; params.push(String(date_from)); }
  if (date_to){ sql += " AND s.datetime <= ?"; params.push(String(date_to)); }
  sql += " ORDER BY s.datetime DESC LIMIT 100";
  const rows = db.prepare(sql).all(...params);
  const data = rows.map(r => ({ ...mapSurgeryRow(r), patientName: `${r.first_name} ${r.last_name}` }));
  res.json({ data });
});

app.get("/api/surgeries/:id", (req,res)=>{
  const row = db.prepare("SELECT * FROM surgeries WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json({ data: mapSurgeryRow(row) });
});

app.post("/api/surgeries", (req,res)=>{
  const parsed = surgerySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const s = parsed.data;

  const patientExists = db.prepare("SELECT 1 FROM patients WHERE id=?").get(s.patientId);
  if (!patientExists) return res.status(400).json({ error: "Invalid patientId" });

  const id = `s_${Math.random().toString(36).slice(2,9)}`;
  const now = nowISO();
db.prepare(`INSERT INTO surgeries (
  id, title, patient_id, type, status, datetime, duration_min, surgeon, notes, created_at, updated_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  .run(
    id,
    s.title,
    s.patientId,
    s.type,
    s.status,
    s.datetime,
    s.durationMin ?? null,
    s.surgeon ?? null,
    s.notes ?? null,
    now,
    now
  );

  const row = db.prepare("SELECT * FROM surgeries WHERE id=?").get(id);
  res.status(201).json({ data: mapSurgeryRow(row) });
});

app.patch("/api/surgeries/:id", (req,res)=>{
  const existing = db.prepare("SELECT * FROM surgeries WHERE id=?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const parsed = surgerySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const s = { ...mapSurgeryRow(existing), ...parsed.data };

  db.prepare(`UPDATE surgeries SET title=?, patient_id=?, type=?, status=?, datetime=?, duration_min=?, surgeon=?, notes=?, updated_at=? WHERE id=?`)
    .run(s.title, s.patientId, s.type, s.status, s.datetime, s.durationMin ?? null, s.surgeon ?? null, s.notes ?? null, nowISO(), req.params.id);

  const row = db.prepare("SELECT * FROM surgeries WHERE id=?").get(req.params.id);
  res.json({ data: mapSurgeryRow(row) });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
