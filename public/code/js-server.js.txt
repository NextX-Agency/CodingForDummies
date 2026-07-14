// backend/server.js
// Deze ene backend-file bevat de database, validatie en API-routes.
// Dat houdt de eerste JavaScript-versie makkelijk te volgen.

const fs = require("fs");
const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const projectRoot = path.join(__dirname, "..");
const dataDirectory = process.env.CFD_DATA_DIR
  ? path.resolve(process.env.CFD_DATA_DIR)
  : path.join(projectRoot, "data");
const frontendDirectory = path.join(projectRoot, "frontend");

fs.mkdirSync(dataDirectory, { recursive: true });

const db = new Database(path.join(dataDirectory, "app.sqlite"));
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_number TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    education TEXT NOT NULL,
    country_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);
  CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
  CREATE INDEX IF NOT EXISTS idx_students_country ON students(country_id);
`);

const countryCount = db.prepare("SELECT COUNT(*) AS total FROM countries").get().total;

if (countryCount === 0) {
  const insertCountry = db.prepare(
    "INSERT INTO countries (name, code, region) VALUES (?, ?, ?)"
  );

  const seedCountries = db.transaction(() => {
    insertCountry.run("Suriname", "SR", "Zuid-Amerika");
    insertCountry.run("Nederland", "NL", "Europa");
    insertCountry.run("België", "BE", "Europa");
    insertCountry.run("Guyana", "GY", "Zuid-Amerika");
    insertCountry.run("Curaçao", "CW", "Cariben");
  });

  seedCountries();
}

app.use(express.json());
app.use(express.static(frontendDirectory));

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requiredText(value, label, maxLength = 120) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw httpError(400, `${label} is verplicht.`);
  }

  if (text.length > maxLength) {
    throw httpError(400, `${label} mag maximaal ${maxLength} tekens bevatten.`);
  }

  return text;
}

function readId(value, label = "ID") {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw httpError(400, `${label} is ongeldig.`);
  }

  return id;
}

function readStudent(body = {}) {
  const student = {
    studentNumber: requiredText(body.studentNumber, "Studentnummer", 30).toUpperCase(),
    firstName: requiredText(body.firstName, "Voornaam", 80),
    lastName: requiredText(body.lastName, "Achternaam", 100),
    email: requiredText(body.email, "E-mailadres", 160).toLowerCase(),
    education: requiredText(body.education, "Opleiding", 120),
    countryId: readId(body.countryId, "Land"),
    status: requiredText(body.status, "Status", 20)
  };

  if (!student.email.includes("@")) {
    throw httpError(400, "Vul een geldig e-mailadres in.");
  }

  if (!["active", "inactive", "graduated"].includes(student.status)) {
    throw httpError(400, "Kies een geldige status.");
  }

  if (!db.prepare("SELECT id FROM countries WHERE id = ?").get(student.countryId)) {
    throw httpError(400, "Het gekozen land bestaat niet.");
  }

  return student;
}

function readCountry(body = {}) {
  const country = {
    name: requiredText(body.name, "Landnaam", 100),
    code: requiredText(body.code, "Landcode", 2).toUpperCase(),
    region: requiredText(body.region, "Regio", 80)
  };

  if (!/^[A-Z]{2}$/.test(country.code)) {
    throw httpError(400, "De landcode moet uit precies twee letters bestaan.");
  }

  return country;
}

const studentFields = `
  students.id,
  students.student_number AS studentNumber,
  students.first_name AS firstName,
  students.last_name AS lastName,
  students.email,
  students.education,
  students.country_id AS countryId,
  countries.name AS countryName,
  countries.code AS countryCode,
  students.status,
  students.created_at AS createdAt,
  students.updated_at AS updatedAt
`;

function getStudent(id) {
  return db.prepare(`
    SELECT ${studentFields}
    FROM students
    JOIN countries ON countries.id = students.country_id
    WHERE students.id = ?
  `).get(id);
}

app.get("/api/stats", (req, res) => {
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM students) AS totalStudents,
      (SELECT COUNT(*) FROM students WHERE status = 'active') AS activeStudents,
      (SELECT COUNT(*) FROM students WHERE status = 'graduated') AS graduatedStudents,
      (SELECT COUNT(*) FROM countries) AS totalCountries
  `).get();

  res.json(stats);
});

app.get("/api/students", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "all");
  const countryId = Number(req.query.countryId) || 0;
  const where = [];
  const params = {};

  if (search) {
    where.push(`(
      students.student_number LIKE @search OR
      students.first_name LIKE @search OR
      students.last_name LIKE @search OR
      students.email LIKE @search OR
      students.education LIKE @search
    )`);
    params.search = `%${search}%`;
  }

  if (["active", "inactive", "graduated"].includes(status)) {
    where.push("students.status = @status");
    params.status = status;
  }

  if (countryId > 0) {
    where.push("students.country_id = @countryId");
    params.countryId = countryId;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const students = db.prepare(`
    SELECT ${studentFields}
    FROM students
    JOIN countries ON countries.id = students.country_id
    ${whereSql}
    ORDER BY students.id DESC
  `).all(params);

  res.json(students);
});

app.get("/api/students/:id", (req, res) => {
  const student = getStudent(readId(req.params.id, "Student-ID"));

  if (!student) {
    throw httpError(404, "Student niet gevonden.");
  }

  res.json(student);
});

app.post("/api/students", (req, res) => {
  const student = readStudent(req.body);
  const result = db.prepare(`
    INSERT INTO students
      (student_number, first_name, last_name, email, education, country_id, status, updated_at)
    VALUES
      (@studentNumber, @firstName, @lastName, @email, @education, @countryId, @status, CURRENT_TIMESTAMP)
  `).run(student);

  res.status(201).json(getStudent(result.lastInsertRowid));
});

app.put("/api/students/:id", (req, res) => {
  const id = readId(req.params.id, "Student-ID");
  const student = { ...readStudent(req.body), id };
  const result = db.prepare(`
    UPDATE students SET
      student_number = @studentNumber,
      first_name = @firstName,
      last_name = @lastName,
      email = @email,
      education = @education,
      country_id = @countryId,
      status = @status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(student);

  if (result.changes === 0) {
    throw httpError(404, "Student niet gevonden.");
  }

  res.json(getStudent(id));
});

app.delete("/api/students/:id", (req, res) => {
  const result = db.prepare("DELETE FROM students WHERE id = ?")
    .run(readId(req.params.id, "Student-ID"));

  if (result.changes === 0) {
    throw httpError(404, "Student niet gevonden.");
  }

  res.status(204).send();
});

app.get("/api/countries", (req, res) => {
  const countries = db.prepare(`
    SELECT
      countries.id,
      countries.name,
      countries.code,
      countries.region,
      COUNT(students.id) AS studentCount
    FROM countries
    LEFT JOIN students ON students.country_id = countries.id
    GROUP BY countries.id
    ORDER BY countries.name COLLATE NOCASE
  `).all();

  res.json(countries);
});

app.post("/api/countries", (req, res) => {
  const country = readCountry(req.body);
  const result = db.prepare(`
    INSERT INTO countries (name, code, region, updated_at)
    VALUES (@name, @code, @region, CURRENT_TIMESTAMP)
  `).run(country);

  res.status(201).json({ id: result.lastInsertRowid, ...country, studentCount: 0 });
});

app.put("/api/countries/:id", (req, res) => {
  const country = { ...readCountry(req.body), id: readId(req.params.id, "Land-ID") };
  const result = db.prepare(`
    UPDATE countries SET
      name = @name,
      code = @code,
      region = @region,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run(country);

  if (result.changes === 0) {
    throw httpError(404, "Land niet gevonden.");
  }

  res.json(country);
});

app.delete("/api/countries/:id", (req, res) => {
  const id = readId(req.params.id, "Land-ID");
  const inUse = db.prepare("SELECT COUNT(*) AS total FROM students WHERE country_id = ?").get(id).total;

  if (inUse > 0) {
    throw httpError(400, "Dit land is nog gekoppeld aan studenten.");
  }

  const result = db.prepare("DELETE FROM countries WHERE id = ?").run(id);

  if (result.changes === 0) {
    throw httpError(404, "Land niet gevonden.");
  }

  res.status(204).send();
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API-route niet gevonden." });
});

app.use((error, req, res, next) => {
  if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
    res.status(409).json({ error: "Dit studentnummer, e-mailadres of deze landcode bestaat al." });
    return;
  }

  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Onbekende serverfout." });
});

const server = app.listen(PORT, () => {
  console.log(`JavaScript CRUD draait op http://localhost:${PORT}`);
});

module.exports = { app, db, server };
