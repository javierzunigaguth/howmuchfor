// This file holds all routes for the items. server.js plugs it in under /api/items,
// so a path written as '/' here means /api/items and '/:id' means /api/items/:id
const express = require('express');
// The two dots go one folder up, because this file is inside the routes folder
const db = require('../databank');

// A router is a small container for a group of routes. It does the same job as "app" did
const router = express.Router();

// This route saves a new item.
// The values are written with ? and given as a list, so no one can put SQL into the fields
router.post('/', (req, res) => {
    const {name, category, subcategory, purchase_date, purchase_price, estimated_value} = req.body;

    db.run(
        `INSERT INTO items (name, category, subcategory, purchase_date, purchase_price, estimated_value)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, category, subcategory, purchase_date, purchase_price, estimated_value],
        // This is a normal function and not an arrow function, because only then "this" holds
        // the info of the query, like the lastID
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

// This route gives back all items. The db.all() gives back every row as a list
router.get('/', (req, res) => {
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

// This route updates one item.
// All fields are always written, also the ones the user didn't change.
// The frontend sends the whole item back, so nothing gets lost
router.put('/:id', (req, res) => {
    const {id} = req.params;
    const {name, category, subcategory, purchase_date, purchase_price, estimated_value} = req.body;

    db.run(
        `UPDATE items
         SET name            = ?,
             category        = ?,
             subcategory     = ?,
             purchase_date   = ?,
             purchase_price  = ?,
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

// This route deletes one item.
// The "this.changes" says how many rows were deleted. If it is 0 the id didn't exist
router.delete('/:id', (req, res) => {
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

// This makes the router available to server.js
module.exports = router;