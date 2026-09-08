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

db.run(`DROP TABLE IF EXISTS category_subcategories`);
db.run(`DROP TABLE IF EXISTS subcategories`);
db.run(`DROP TABLE IF EXISTS categories`);

db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS category_subcategories (
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER NOT NULL,
    PRIMARY KEY (category_id, subcategory_id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT
  )
`);

module.exports = db;