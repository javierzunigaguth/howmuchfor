// This file holds all routes for the categories. server.js plugs it in under /api/categories,
// so a path written as '/' here means /api/categories and '/:id' means /api/categories/:id
const express = require('express');
// The two dots go one folder up, because this file is inside the routes folder
const db = require('../databank');

// A router is a small container for a group of routes. It does the same job as "app" did
const router = express.Router();

// This route gives back all categories
router.get('/', (req, res) => {
    db.all(`SELECT *
            FROM categories`, [], (err, rows) => {
        if (err) return res.status(500).json({message: 'Failed to fetch categories.'});
        res.json(rows);
    });
});

// This route saves a new category.
// The name is UNIQUE in the table, so a name that already exists lands in the error branch
router.post('/', (req, res) => {
    const {name} = req.body;
    db.run(`INSERT INTO categories (name)
            VALUES (?)`, [name], function (err) {
        if (err) return res.status(500).json({message: 'Failed to add category. It may already exist.'});
        res.json({message: `Category "${name}" added.`, id: this.lastID});
    });
});

// This route renames a category.
// Careful: the items save the category as a name. After a rename they still hold the old name
// and don't show up under the new category anymore
router.put('/:id', (req, res) => {
    const {id} = req.params;
    const {name} = req.body;

    db.run(
        `UPDATE categories
         SET name = ?
         WHERE id = ?`,
        [name, id],
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

// This route deletes a category, but only if no item uses it anymore.
// It happens in three steps, one inside the other, because the result of every step is needed
// for the next one
router.delete('/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT name
            FROM categories
            WHERE id = ?`, [id], (err, category) => {
        if (err || !category) return res.status(404).json({message: 'Category not found.'});

        db.get(`SELECT COUNT(*) AS count
                FROM items
                WHERE category = ?`, [category.name], (countErr, result) => {
            if (countErr) {
                console.error(countErr.message);
                return res.status(500).json({message: 'Failed to check category usage.'});
            }

            if (result.count > 0) {
                return res.status(400).json({message: `Cannot delete "${category.name}": ${result.count} item(s) still use it.`});
            }

            db.run(`DELETE
                    FROM category_subcategories
                    WHERE category_id = ?`, [id]);
            db.run(`DELETE
                    FROM categories
                    WHERE id = ?`, [id], (deleteErr) => {
                if (deleteErr) return res.status(500).json({message: 'Failed to delete category.'});
                res.json({message: `Category "${category.name}" deleted.`});
            });
        });
    });
});

// This makes the router available to server.js
module.exports = router;