// This file opens the database and creates the tables. It is loaded by server.js
const sqlite3 = require('sqlite3').verbose();

// This opens the database file. If the file doesn't exist yet, SQLite creates it.
// The path is relative to the folder the server is started from, not to this file
const db = new sqlite3.Database('./howmuchfor.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the howmuchfor database.');
  }
});

// This is the table for the items.
// The category and the subcategory are saved as TEXT, so as the name and not as an id.
// That is why renaming a category in the Categories page leaves the old name in the items
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

// This is the table for the categories. The name is UNIQUE, so the same category
// can't be added twice. The INSERT gives back an error then
db.run(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

// This is the table for the subcategories. The name is UNIQUE in the whole table, so a
// subcategory name exists only once here. That is not a limitation, it is the idea behind the
// design: there is no second "Kitchen" row for a second category. There is one "Kitchen" row
// and it gets linked to as many categories as needed through category_subcategories
db.run(`
  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT
  )
`);

// This is the table that links the categories and the subcategories.
// A subcategory can belong to more than one category, that's why the link needs its own table.
// The two ids together are the primary key, so the same pair can't be saved twice.
// Careful: SQLite doesn't check the FOREIGN KEY lines by default. For that the server would
// have to run "PRAGMA foreign_keys = ON" after opening the database
db.run(`
  CREATE TABLE IF NOT EXISTS category_subcategories (
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER NOT NULL,
    PRIMARY KEY (category_id, subcategory_id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
  )
`);

// This is the table for the profile. There is no user system, the app only saves one profile
// and it always has the id 1. That's why there is no AUTOINCREMENT here
db.run(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT
  )
`);

// This gives the open connection to server.js, so the routes can use the same one
module.exports = db;