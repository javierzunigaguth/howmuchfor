// This file holds all routes for the subcategories. server.js plugs it in under /api/subcategories,
// so a path written as '/' here means /api/subcategories and '/:id' means /api/subcategories/:id
const express = require('express');
// The two dots go one folder up, because this file is inside the routes folder
const db = require('../databank');

// A router is a small container for a group of routes. It does the same job as "app" did
const router = express.Router();

// This route gives back all subcategories together with the categories they belong to.
// The LEFT JOIN is used twice, so a subcategory without any category is still in the result.
// The GROUP_CONCAT puts all ids and all names of one subcategory into one text, separated by commas
router.get('/', (req, res) => {
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

            // Here the two texts are split back into real lists, because the frontend works with
            // lists. Without any category the value is null, then an empty list is used.
            // Careful: this breaks if a category name itself has a comma in it
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

// This route saves a new subcategory and its links to the categories
router.post('/', (req, res) => {
    const {name, icon, category_ids} = req.body;

    if (!Array.isArray(category_ids)) {
        return res.status(400).json({message: 'category_ids must be an array.'});
    }

    db.run(`INSERT INTO subcategories (name, icon)
            VALUES (?, ?)`, [name, icon], function (err) {
        if (err) return res.status(500).json({message: 'Failed to add subcategory. It may already exist.'});

        // The new id is needed for the link table
        const subcategoryId = this.lastID;
        // The prepare() builds the query once and runs it for every category, that is faster
        // than building it again every time.
        const stmt = db.prepare(`INSERT INTO category_subcategories (category_id, subcategory_id)
                                 VALUES (?, ?)`);

        category_ids.forEach(catId => stmt.run(catId, subcategoryId));
        // The answer is only sent after the finalize(), so all links are really written
        stmt.finalize(() => {
            res.json({message: `Subcategory "${name}" added.`, id: subcategoryId});
        });
    });
});

// This route updates a subcategory.
// The links are not compared, the old ones are simply deleted and the new ones written again
router.put('/:id', (req, res) => {
    const {id} = req.params;
    const {name, icon, category_ids} = req.body;

    if (!Array.isArray(category_ids)) {
        return res.status(400).json({message: 'category_ids must be an array.'});
    }

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

// This route deletes a subcategory. It works the same way as the one for the categories:
// first the name, then the count of the items, then the delete
router.delete('/:id', (req, res) => {
    const {id} = req.params;
    db.get(`SELECT name
            FROM subcategories
            WHERE id = ?`, [id], (err, subcategory) => {
        if (err || !subcategory) return res.status(404).json({message: 'Subcategory not found.'});

        db.get(`SELECT COUNT(*) AS count
                FROM items
                WHERE subcategory = ?`, [subcategory.name], (countErr, result) => {
            if (countErr) {
                console.error(countErr.message);
                return res.status(500).json({message: 'Failed to check subcategory usage.'});
            }

            if (result.count > 0) {
                return res.status(400).json({message: `Cannot delete "${subcategory.name}": ${result.count} item(s) still use it.`});
            }

            // The links have to go first, otherwise they point to a subcategory that is gone
            db.run(`DELETE
                    FROM category_subcategories
                    WHERE subcategory_id = ?`, [id]);
            db.run(`DELETE
                    FROM subcategories
                    WHERE id = ?`, [id], (deleteErr) => {
                if (deleteErr) return res.status(500).json({message: 'Failed to delete subcategory.'});
                res.json({message: `Subcategory "${subcategory.name}" deleted.`});
            });
        });
    });
});

// This makes the router available to server.js
module.exports = router;