# CadetPortal

A long-term CY300 project: a web portal for West Point cadets made of a **Python Flask server** (backend API) and a **React webpage** (frontend). It is a single place to find information and links that matter in cadet life.

## Scope

- **In scope (this repo):** the portal. It shows quick links to common services (Regulation Wizard, Citemate, etc.), ferry hours, the Uniform of the Day (UOD) and announcements.
- **Study decks ("Cadet Quizlet") at `/quizlet`:** cadets search flashcard decks by class, instructor, or topic, study them, and make/edit their own. Decks are saved in the `decks` and `cards` tables. Study modes: Flashcards, Learn (self-graded, progress saved in localStorage), and Test (multiple choice), switched with tabs on the deck page. Study modes receive cards as `{ front, back }` (DeckView swaps them for "definition first"). Possible future modes: Match.
- **No login.** Don't add accounts or authentication. Portal info is public and read-only. The only exception is study decks: anyone can create one, and each deck has an **edit code** (stored hashed) that's needed to edit or delete it.

## Tech Stack

- **Server:** Python 3 + Flask (a REST API that returns JSON)
- **Webpage:** React (calls the Flask API with `fetch`), with `react-router` for page URLs (`/`, `/quizlet`, ...)
- **Data storage:** MySQL on TiDB Cloud (free Serverless tier), using the `pymysql` driver. Connection settings come from environment variables (`server/.env` locally, Vercel project settings online).
- **Hosting:** Vercel. `vercel.json` builds the React app from `client/` and runs Flask as a Python serverless function through `api/index.py`. The Vercel project's Root Directory must be the repo root.

## Project Layout

```
CadetPortal/
├── api/index.py         # Vercel entry point: loads server/app.py
├── vercel.json          # Vercel build settings + /api and page rewrites
├── requirements.txt     # Python packages Vercel installs (keep in sync with server/requirements.txt)
├── server/              # Flask backend
│   ├── app.py           # Starts the server and defines routes
│   ├── db.py            # Opens MySQL connections; fetch_all / fetch_one helpers
│   ├── storage.py       # Every query that reads or saves data
│   ├── decks.py         # Study deck input checks and edit codes
│   ├── setup_database.py # Run once: creates the tables and loads data/*.json
│   ├── update_uod.py    # Manual UOD update: python update_uod.py "Class B" "notes" (uses storage.save_uod)
│   ├── data/            # Starting data (JSON), only used by setup_database.py
│   ├── .env.example     # Template for server/.env (database settings; .env is never committed)
│   ├── conftest.py      # Test setup: uses a separate test database
│   ├── tests/           # pytest tests (test_decks.py, test_deck_routes.py)
│   └── requirements.txt # Python dependencies (flask, pymysql, certifi, python-dotenv, pytest)
├── client/              # React frontend
│   └── src/
│       ├── main.jsx     # Starts React inside a BrowserRouter
│       ├── App.jsx      # Top bar + the list of page routes
│       ├── api.js       # fetchJson: every API call goes through it; failures become readable Error messages
│       ├── studyHelpers.js # Shared non-component helpers (shuffle, keyboard checks, .txt export)
│       └── components/  # One component per file (HomePage, QuizletHome, DeckView, Flashcards, Learn, Test, DeckEditor, ...)
├── README.md
└── CLAUDE.md
```

Keep this layout up to date if the structure changes.

## Coding Rules (most important)

1. **Clean and basic code.** Write code a beginner can read top to bottom.
   - Avoid complex functions, clever one-liners, deep nesting, decorators beyond Flask's `@app.route`, metaclasses, and heavy abstractions.
   - Keep each function short and focused on one job.
   - Use plain loops and `if` statements instead of dense comprehensions or chained functional tricks when they are hard to read.
   - Don't add libraries unless they are really needed. Ask before adding a new dependency.
2. **Comment and document everything.**
   - Every file starts with a short header comment explaining what the file is for.
   - Every function or React component has a docstring/comment explaining what it does, its inputs, and what it returns.
   - Add inline comments on any line or block whose purpose isn't obvious.
   - Python: use `"""docstrings"""`. JavaScript/React: use `/** JSDoc-style */` comments.
3. **Clear names.** Use descriptive variable and function names (`load_announcements`, not `la`).
4. **Consistent style.**
   - Python: PEP 8, `snake_case` for functions and variables.
   - React: functional components with hooks (`useState`, `useEffect`), `PascalCase` for component names, `camelCase` for variables.
5. **Simple error handling.** Check for missing or bad input and return a clear error message (for example, a JSON `{"error": "..."}` with a 400 status). Don't add elaborate exception hierarchies.

## Data (MySQL)

- Tables: `links`, `announcements`, `uod` (one row, id 1), `schedules` (ferry and shuttle, each stored whole as JSON), `decks`, `cards`. They are defined in `setup_database.py`.
- All database reading and writing goes through the functions in `storage.py`. Routes should not run SQL directly.
- Always pass values with `%s` placeholders (never build SQL by adding strings together) so queries are safe from SQL injection.
- `storage.py` returns the same shapes the old JSON files had. Dates are sent as text, e.g. `"2026-10-01"`.
- Example announcement record:
  ```json
  { "id": 1, "title": "Formation Change", "body": "Formation is at 0645 tomorrow.", "author": "CPT Smith", "date": "2026-10-01" }
  ```

## Frontend Conventions

- Call the API with `fetchJson` from `client/src/api.js`, never `fetch` directly. Catch errors and show them to the cadet (an `errorMessage` state rendered as `<p className="error-message" role="alert">`). Never leave a page stuck on "Loading..." or a button that silently fails.
- Deck import goes through a preview (`ImportPreview` in `DeckEditor.jsx`): malformed lines are listed by line number and never added silently. Client checks mirror the server's (`MAX_CARD_TEXT_LENGTH`).

## API Conventions

- All API routes start with `/api/` (e.g. `GET /api/announcements`, `POST /api/announcements`).
- Routes return JSON.
- Document each route with a comment above it that gives the method, URL, request body, and response.

## Running the Project

Use two terminals, one for each part:

- Server: `cd server`, `pip install -r requirements.txt` (first time only), copy `.env.example` to `.env` and fill it in (first time only), `python setup_database.py` (first time only), then `python app.py`. It runs on http://localhost:5000.
- Webpage: `cd client`, `npm install` (first time only), then `npm run dev`. Open http://localhost:5173.

Tests: `cd server`, then `python -m pytest`. The route tests use the separate `TEST_DB_NAME` database and are skipped if no database is configured. Add or update tests when changing `decks.py`, `storage.py`, or the deck routes.

The Vite dev server forwards every `/api/...` request to Flask (see `client/vite.config.js`), so React code calls `fetch("/api/...")` with no full URL and no CORS setup.

## Working Style for Claude

- Explain changes in plain language. This is a learning project.
- Prefer small, incremental changes over large rewrites.
- When there are two ways to do something, choose the simpler and more readable one.
