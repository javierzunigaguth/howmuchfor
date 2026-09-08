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