const express = require('express');
const path = require('path');
const db = require('./databank');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
    res.json({message: 'Backend connection successful!'});
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

app.post('/api/items', (req, res) => {
    const {name, category, subcategory, purchase_date, purchase_price, estimated_value} = req.body;

    db.run(
        `INSERT INTO items (name, category, subcategory, purchase_date, purchase_price, estimated_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, category, subcategory, purchase_date, purchase_price, estimated_value],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({message: 'Failed to add item.'});
            } else {
                res.json({message: `Item added with ID ${this.lastID}`});
            }
        }
    );
});

app.get('/api/items', (req, res) => {
    db.all(`SELECT *
            FROM items`, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({message: 'Failed to fetch items.'});
        } else {
            res.json(rows);
        }
    });
});

app.delete('/api/items/:id', (req, res) => {
    const {id} = req.params;

    db.run(`DELETE
            FROM items
            WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error(err.message);
            res.status(500).json({message: 'Failed to delete item.'});
        } else if (this.changes === 0) {
            res.status(404).json({message: 'Item not found.'});
        } else {
            res.json({message: 'Item deleted.'});
        }
    });
});

app.get('/api/categories', (req, res) => {
    db.all(`SELECT *
            FROM categories`, [], (err, rows) => {
        if (err) return res.status(500).json({message: 'Failed to fetch categories.'});
        res.json(rows);
    });
});

app.post('/api/categories', (req, res) => {
    const {name} = req.body;
    db.run(`INSERT INTO categories (name)
            VALUES (?)`, [name], function (err) {
        if (err) return res.status(500).json({message: 'Failed to add category. It may already exist.'});
        res.json({message: `Category "${name}" added.`, id: this.lastID});
    });
});

app.put('/api/categories/:id', (req, res) => {
    const {id} = req.params;
    const {name} = req.body;
    db.run(`UPDATE categories
            SET name = ?
            WHERE id = ?`, [name, id], function (err) {
        if (err) return res.status(500).json({message: 'Failed to update category.'});
        if (this.changes === 0) return res.status(404).json({message: 'Category not found.'});
        res.json({message: 'Category updated.'});
    });
});

app.delete('/api/categories/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT name
            FROM categories
            WHERE id = ?`, [id], (err, category) => {
        if (err || !category) return res.status(404).json({message: 'Category not found.'});

        db.get(`SELECT COUNT(*) AS count
                FROM items
                WHERE category = ?`, [category.name], (err, result) => {
            if (result.count > 0) {
                return res.status(400).json({message: `Cannot delete "${category.name}": ${result.count} item(s) still use it.`});
            }

            db.run(`DELETE
                    FROM category_subcategories
                    WHERE category_id = ?`, [id]);
            db.run(`DELETE
                    FROM categories
                    WHERE id = ?`, [id], (err) => {
                if (err) return res.status(500).json({message: 'Failed to delete category.'});
                res.json({message: `Category "${category.name}" deleted.`});
            });
        });
    });
});

app.get('/api/subcategories', (req, res) => {
    db.all(
        `SELECT subcategories.id,
                subcategories.name,
                subcategories.icon,
                GROUP_CONCAT(categories.id)   AS category_ids,
                GROUP_CONCAT(categories.name) AS category_names
         FROM subcategories
                  LEFT JOIN category_subcategories ON subcategories.id = category_subcategories.subcategory_id
                  LEFT JOIN categories ON category_subcategories.category_id = categories.id
         GROUP BY subcategories.id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({message: 'Failed to fetch subcategories.'});

            const formatted = rows.map(row => ({
                id: row.id,
                name: row.name,
                icon: row.icon,
                category_ids: row.category_ids ? row.category_ids.split(',').map(Number) : [],
                category_names: row.category_names ? row.category_names.split(',') : []
            }));

            res.json(formatted);
        }
    );
});

app.post('/api/subcategories', (req, res) => {
    const {name, icon, category_ids} = req.body;

    db.run(`INSERT INTO subcategories (name, icon)
            VALUES (?, ?)`, [name, icon], function (err) {
        if (err) return res.status(500).json({message: 'Failed to add subcategory. It may already exist.'});

        const subcategoryId = this.lastID;
        const stmt = db.prepare(`INSERT INTO category_subcategories (category_id, subcategory_id)
                                 VALUES (?, ?)`);
        category_ids.forEach(catId => stmt.run(catId, subcategoryId));
        stmt.finalize(() => {
            res.json({message: `Subcategory "${name}" added.`, id: subcategoryId});
        });
    });
});

app.put('/api/subcategories/:id', (req, res) => {
    const {id} = req.params;
    const {name, icon, category_ids} = req.body;

    db.run(`UPDATE subcategories
            SET name = ?,
                icon = ?
            WHERE id = ?`, [name, icon, id], (err) => {
        if (err) return res.status(500).json({message: 'Failed to update subcategory.'});

        db.run(`DELETE
                FROM category_subcategories
                WHERE subcategory_id = ?`, [id], () => {
            const stmt = db.prepare(`INSERT INTO category_subcategories (category_id, subcategory_id)
                                     VALUES (?, ?)`);
            category_ids.forEach(catId => stmt.run(catId, id));
            stmt.finalize(() => {
                res.json({message: 'Subcategory updated.'});
            });
        });
    });
});

app.delete('/api/subcategories/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT name
            FROM subcategories
            WHERE id = ?`, [id], (err, subcategory) => {
        if (err || !subcategory) return res.status(404).json({message: 'Subcategory not found.'});

        db.get(`SELECT COUNT(*) AS count
                FROM items
                WHERE subcategory = ?`, [subcategory.name], (err, result) => {
            if (result.count > 0) {
                return res.status(400).json({message: `Cannot delete "${subcategory.name}": ${result.count} item(s) still use it.`});
            }

            db.run(`DELETE
                    FROM category_subcategories
                    WHERE subcategory_id = ?`, [id]);
            db.run(`DELETE
                    FROM subcategories
                    WHERE id = ?`, [id], (err) => {
                if (err) return res.status(500).json({message: 'Failed to delete subcategory.'});
                res.json({message: `Subcategory "${subcategory.name}" deleted.`});
            });
        });
    });
});

app.get('/api/profile', (req, res) => {
    db.get(`SELECT *
            FROM profile
            WHERE id = 1`, [], (err, row) => {
        if (err) {
            res.status(500).json({message: 'Failed to fetch profile.'});
        } else {
            res.json(row || {});
        }
    });
});

app.post('/api/profile', (req, res) => {
    const {first_name, last_name} = req.body;

    db.run(
        `INSERT INTO profile (id, first_name, last_name)
         VALUES (1, ?, ?) ON CONFLICT(id) DO
        UPDATE SET first_name = ?, last_name = ?`,
        [first_name, last_name, first_name, last_name],
        (err) => {
            if (err) {
                res.status(500).json({message: 'Failed to save profile.'});
            } else {
                res.json({message: 'Profile saved.'});
            }
        }
    );
});

app.put('/api/items/:id', (req, res) => {
    const {id} = req.params;
    const {name, category, subcategory, purchase_date, purchase_price, estimated_value} = req.body;

    db.run(
        `UPDATE items
         SET name = ?,
             category = ?,
             subcategory = ?,
             purchase_date = ?,
             purchase_price = ?,
             estimated_value = ?
         WHERE id = ?`,
        [name, category, subcategory, purchase_date, purchase_price, estimated_value, id],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({message: 'Failed to update item.'});
            } else if (this.changes === 0) {
                res.status(404).json({message: 'Item not found.'});
            } else {
                res.json({message: 'Item updated.'});
            }
        }
    );
});

app.put('/api/categories/:id', (req, res) => {
    const {id} = req.params;
    const {name, icon} = req.body;

    db.run(
        `UPDATE categories
         SET name = ?,
             icon = ?
         WHERE id = ?`,
        [name, icon, id],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({message: 'Failed to update category. Name may already exist.'});
            } else if (this.changes === 0) {
                res.status(404).json({message: 'Category not found.'});
            } else {
                res.json({message: 'Category updated.'});
            }
        }
    );
});

app.put('/api/subcategories/:id', (req, res) => {
    const {id} = req.params;
    const {name, category_id} = req.body;

    db.run(
        `UPDATE subcategories
         SET name = ?,
             category_id = ?
         WHERE id = ?`,
        [name, category_id, id],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({message: 'Failed to update subcategory.'});
            } else if (this.changes === 0) {
                res.status(404).json({message: 'Subcategory not found.'});
            } else {
                res.json({message: 'Subcategory updated.'});
            }
        }
    );
});