# CadetPortal

A long-term CY300 project: a web portal for West Point cadets made of a **Python Flask server** (backend API) and a **React webpage** (frontend). It is a single place to find information and links that matter in cadet life.

## Scope

- **In scope (this repo):** the portal. It shows quick links to common services (Regulation Wizard, Citemate, etc.), ferry hours, the Uniform of the Day (UOD) and announcements.
- **Study decks ("Cadet Quizlet") at `/quizlet`:** cadets search flashcard decks by class, instructor, or topic, study them, and make/edit their own. Decks are saved in `server/data/decks.json`. Study modes so far: Flashcards. Possible future modes: Learn, Test, Match.
- **No login.** Don't add accounts or authentication. Portal info is public and read-only. The only exception is study decks: anyone can create one, and each deck has an **edit code** (stored hashed) that's needed to edit or delete it.

## Tech Stack

- **Server:** Python 3 + Flask (a REST API that returns JSON)
- **Webpage:** React (calls the Flask API with `fetch`), with `react-router` for page URLs (`/`, `/quizlet`, ...)
- **Data storage:** JSON files on disk (CSV for simple tables only, if needed). No database for now.

## Planned Project Layout

```
CadetPortal/
├── server/              # Flask backend
│   ├── app.py           # Starts the server and defines routes
│   ├── storage.py       # Small helpers to read/write JSON data files
│   ├── decks.py         # Helpers for study decks (search, checks, edit codes)
│   ├── data/            # JSON data files (e.g. announcements.json, decks.json)
│   └── requirements.txt # Python dependencies
├── client/              # React frontend
│   └── src/
│       ├── main.jsx     # Starts React inside a BrowserRouter
│       ├── App.jsx      # Top bar + the list of page routes
│       └── components/  # One component per file (HomePage, QuizletHome, DeckView, Flashcards, DeckEditor, ...)
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

## Data (JSON files)

- Store each type of data in its own file in `server/data/` (e.g. `announcements.json`).
- All file reading and writing goes through the helpers in `storage.py`. Routes should not open files directly.
- Example announcement record:
  ```json
  { "id": 1, "title": "Formation Change", "body": "Formation is at 0645 tomorrow.", "author": "CPT Smith", "date": "2026-10-01" }
  ```

## API Conventions

- All API routes start with `/api/` (e.g. `GET /api/announcements`, `POST /api/announcements`).
- Routes return JSON.
- Document each route with a comment above it that gives the method, URL, request body, and response.

## Running the Project

Use two terminals, one for each part:

- Server: `cd server`, `pip install -r requirements.txt` (first time only), then `python app.py`. It runs on http://localhost:5000.
- Webpage: `cd client`, `npm install` (first time only), then `npm run dev`. Open http://localhost:5173.

The Vite dev server forwards every `/api/...` request to Flask (see `client/vite.config.js`), so React code calls `fetch("/api/...")` with no full URL and no CORS setup.

## Working Style for Claude

- Explain changes in plain language. This is a learning project.
- Prefer small, incremental changes over large rewrites.
- When there are two ways to do something, choose the simpler and more readable one.
