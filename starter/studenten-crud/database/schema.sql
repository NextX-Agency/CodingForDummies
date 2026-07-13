PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS landen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  naam TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  regio TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS studenten (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentnummer TEXT NOT NULL UNIQUE,
  voornaam TEXT NOT NULL,
  achternaam TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  opleiding TEXT NOT NULL,
  land_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'actief' CHECK (status IN ('actief', 'inactief', 'afgestudeerd')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (land_id) REFERENCES landen(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_studenten_naam ON studenten(achternaam, voornaam);
CREATE INDEX IF NOT EXISTS idx_studenten_status ON studenten(status);
CREATE INDEX IF NOT EXISTS idx_studenten_land_id ON studenten(land_id);

INSERT OR IGNORE INTO landen (naam, code, regio) VALUES
  ('Suriname', 'SR', 'Zuid-Amerika'),
  ('Nederland', 'NL', 'Europa'),
  ('België', 'BE', 'Europa'),
  ('Guyana', 'GY', 'Zuid-Amerika'),
  ('Curaçao', 'CW', 'Cariben');

