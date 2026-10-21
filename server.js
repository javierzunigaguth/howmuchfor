// This is the backend. It serves the files in the "public" folder and gives the frontend
// the /api routes it fetches from
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// This reads the JSON out of the request body and puts it into req.body.
// Without this every req.body would be undefined
app.use(express.json());

// Each app.use line plugs one file from the routes folder into the app.
// The first value is the start of the URL that belongs to that file. For example, a request
// to /api/items/5 goes to routes/items.js, and there it matches '/:id' with 5 as the id
app.use('/api/items', require('./routes/items'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/subcategories', require('./routes/subcategories'));
app.use('/api/profile', require('./routes/profile'));

// This serves the frontend, so the HTML, the CSS and the JS files.
// The path.join builds the path from the folder of this file, so it also works if the server
// is started from somewhere else
app.use(express.static(path.join(__dirname, 'public')));

// This starts the server.
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});