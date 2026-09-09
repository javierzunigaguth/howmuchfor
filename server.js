// This is the backend. It serves the files in the "public" folder and gives the frontend
// the /api routes it fetches from
const express = require('express');
const path = require('path');
// This is the open database connection from databank.js
const db = require('./databank');

const app = express();
const PORT = 3000;

// This reads the JSON out of the request body and puts it into req.body.
// Without this every req.body would be undefined
app.use(express.json());

// This serves the frontend, so the HTML, the CSS and the JS files.
// The path.join builds the path from the folder of this file, so it also works if the server
// is started from somewhere else
app.use(express.static(path.join(__dirname, 'public')));

// This route was only used to test if the frontend reaches the backend. Nothing uses it anymore
app.get('/api/test', (req, res) => {
    res.json({message: 'Backend connection successful!'});
});

// This starts the server. It stands here in the middle of the file, but the routes below are
// still registered, because that happens right away while the file is being read
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

// This route saves a new item.
// The values are written with ? and given as a list, so no one can put SQL into the fields
app.post('/api/items', (req, res) => {
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

// This route deletes one item.
// The "this.changes" says how many rows were deleted. If it is 0 the id didn't exist
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

// This route gives back all categories
app.get('/api/categories', (req, res) => {
    db.all(`SELECT *
            FROM categories`, [], (err, rows) => {
        if (err) return res.status(500).json({message: 'Failed to fetch categories.'});
        res.json(rows);
    });
});

// This route saves a new category.
// The name is UNIQUE in the table, so a name that already exists lands in the error branch
app.post('/api/categories', (req, res) => {
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
app.put('/api/categories/:id', (req, res) => {
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
app.delete('/api/categories/:id', (req, res) => {
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

// This route gives back all subcategories together with the categories they belong to.
// The LEFT JOIN is used twice, so a subcategory without any category is still in the result.
// The GROUP_CONCAT puts all ids and all names of one subcategory into one text, separated by commas
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
app.post('/api/subcategories', (req, res) => {
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
app.put('/api/subcategories/:id', (req, res) => {
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
app.delete('/api/subcategories/:id', (req, res) => {
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
                    WHERE id = ?`, [id], (err) => {
                if (err) return res.status(500).json({message: 'Failed to delete subcategory.'});
                res.json({message: `Subcategory "${subcategory.name}" deleted.`});
            });
        });
    });
});

// This route gives back the profile. There is only one, it always has the id 1.
// If nothing is saved yet, an empty object is sent, so the frontend doesn't get null
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

// This route saves the profile. It is one single query for both cases: if the id 1 doesn't exist
// yet it is inserted, and if it does exist the ON CONFLICT updates it instead.
// That's why the names are in the list twice, once for the INSERT and once for the UPDATE
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

// This route updates one item. It stands at the end of the file, the other item routes are
// at the top. Moving it up there would make the file easier to read
app.put('/api/items/:id', (req, res) => {
    const {id} = req.params;
    const {name, category, subcategory, purchase_date, purchase_price, estimated_value} = req.body;

    // All fields are always written, also the ones the user didn't change.
    // The frontend sends the whole item back, so nothing gets lost
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