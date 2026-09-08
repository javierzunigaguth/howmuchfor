const express = require('express');
const path = require('path');
const db = require('./databank');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend connection successful!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

app.post('/api/items', (req, res) => {
  const { name, category, subcategory, purchase_date, purchase_price, estimated_value } = req.body;

  db.run(
    `INSERT INTO items (name, category, subcategory, purchase_date, purchase_price, estimated_value) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, category, subcategory, purchase_date, purchase_price, estimated_value],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to add item.' });
      } else {
        res.json({ message: `Item added with ID ${this.lastID}` });
      }
    }
  );
});

app.get('/api/items', (req, res) => {
  db.all(`SELECT * FROM items`, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Failed to fetch items.' });
    } else {
      res.json(rows);
    }
  });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM items WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Failed to delete item.' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Item not found.' });
    } else {
      res.json({ message: 'Item deleted.' });
    }
  });
});

app.get('/api/categories', (req, res) => {
  db.all(`SELECT * FROM categories`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Failed to fetch categories.' });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/categories', (req, res) => {
  const { name, icon } = req.body;

  db.run(
    `INSERT INTO categories (name, icon) VALUES (?, ?)`,
    [name, icon],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to add category. It may already exist.' });
      } else {
        res.json({ message: `Category "${name}" added.`, id: this.lastID });
      }
    }
  );
});

app.get('/api/subcategories', (req, res) => {
  db.all(
    `SELECT subcategories.id, subcategories.name, categories.name AS category_name, categories.id AS category_id
     FROM subcategories
     JOIN categories ON subcategories.category_id = categories.id`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ message: 'Failed to fetch subcategories.' });
      } else {
        res.json(rows);
      }
    }
  );
});

app.post('/api/subcategories', (req, res) => {
  const { name, category_id } = req.body;

  db.run(
    `INSERT INTO subcategories (name, category_id) VALUES (?, ?)`,
    [name, category_id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to add subcategory.' });
      } else {
        res.json({ message: `Subcategory "${name}" added.`, id: this.lastID });
      }
    }
  );
});