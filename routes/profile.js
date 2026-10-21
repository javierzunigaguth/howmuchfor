// This file holds all routes for the profile. server.js plugs it in under /api/profile,
// so a path written as '/' here means /api/profile
const express = require('express');
// The two dots go one folder up, because this file is inside the routes folder
const db = require('../databank');

// A router is a small container for a group of routes. It does the same job as "app" did
const router = express.Router();

// This route gives back the profile. There is only one, it always has the id 1.
// If nothing is saved yet, an empty object is sent, so the frontend doesn't get null
router.get('/', (req, res) => {
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
router.post('/', (req, res) => {
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

// This makes the router available to server.js
module.exports = router;