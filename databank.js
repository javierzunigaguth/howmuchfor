const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./howmuchfor.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the howmuchfor database.');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    purchase_date TEXT,
    purchase_price REAL,
    estimated_value REAL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT
  )
`);

module.exports = db;