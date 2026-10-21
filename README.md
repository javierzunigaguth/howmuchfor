# HowMuchFor

HowMuchFor is a small web app for tracking personal belongings and their value: you log items with a purchase price and an estimated current value, organize them by category and subcategory, and view the totals in a dashboard and insights page.

## Technologies

- Frontend: Plain HTML, CSS and JavaScript, served as static files.
- Backend: Node.js with Express.
- Database: SQLite.
- Charts: Chart.js.

## Requirements

- [Node.js](https://nodejs.org/) installed. This project was built and tested with Node v24.18.0 (run `node -v` to check your own version).
- npm (comes bundled with Node.js).
- Git, to clone the repository (or download the ZIP from GitHub instead).

## Installation

```bash
git clone https://github.com/javierzunigaguth/howmuchfor.git
cd howmuchfor
npm install
```

## Running the app

```bash
npm start
```

Then open http://localhost:3000 in your browser.

Run `npm start` from the project folder (the one containing `howmuchfor.db`). `databank.js` opens `./howmuchfor.db` relative to the current working directory, so starting the server from anywhere else creates a new, empty database instead of using the existing data.

## Database

The SQLite database (`howmuchfor.db`) is created and set up automatically: `databank.js` opens the file on startup and creates any missing tables (`items`, `categories`, `subcategories`, `category_subcategories`, `profile`).

The `.db` file is currently committed to the repository, so a fresh clone already comes with whatever data was last saved to it. Keep in mind this also means your local changes to the data will show up as changes to a tracked file in `git status`.

## Project structure

```
howmuchfor/
├── server.js         # Express app entry point: wires up middleware, API routes and static files
├── databank.js       # Opens the SQLite database and creates the tables if they don't exist
├── package.json      # Dependencies and the start script
├── routes/           # Express routers, one per resource (items, categories, subcategories, profile)
├── public/           # Frontend static files served directly by Express
│   ├── *.html        # One HTML page per view (dashboard, items, categories, insights, profile)
│   ├── css/          # Stylesheets
│   └── js/           # Frontend JavaScript, one file per page (dashboard, items, categories, insights, profile)
└── howmuchfor.db     # SQLite database file
```

## Testing

Manual test cases are documented in the presentation.

## Notes

- In the app, categories represent rooms and subcategories represent item types.

- "Category" and "subcategory" don't work the way they usually do: a subcategory is not owned by a single category. Each subcategory is its own row (e.g. "Electronics"), and it can be linked to several categories through the `category_subcategories` table. So the same subcategory can appear under more than one category (e.g. "Electronics" under both "Kitchen" and "Living Room").

- Items store the category and subcategory as plain text (the name), not as a foreign key/id. This means renaming a category or subcategory on the Categories page does not update the name already saved on existing items. They keep the old name.