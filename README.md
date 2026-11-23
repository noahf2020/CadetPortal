# CadetPortal

A web portal for West Point cadets: one place for the links and daily information that matter in cadet life, plus **Study Decks**, a cadet-made flashcard tool.

Built for CY300 with a **Python Flask** server and a **React** webpage.

## Features

**Portal home page**
- Quick Links to common cadet services
- Uniform of the Day
- Ferry hours and shuttle times
- Announcements

**Study Decks (`/quizlet`)**
- Search decks by class, instructor, topic, or any term inside a deck
- Make, edit, copy, and delete decks (no login: each deck has its own **edit code**, stored hashed)
- Import cards from a `.txt` file or by pasting, with tab (default), comma, dash, or a custom separator
- Export any deck to a `.txt` file in the same format
- Three study modes:
  - **Flashcards**: flip through cards, shuffle
  - **Learn**: self-graded ("Got it" / "Still learning"); missed cards come back until every card is learned, and progress is saved in the browser
  - **Test**: multiple-choice quiz with a score and a list of missed questions
- Study term-first or definition-first
- Keyboard shortcuts:

  | Mode | Keys |
  |---|---|
  | Flashcards | `Space` flip, `←` `→` previous / next |
  | Learn | `Space` flip, `1` still learning, `2` got it |
  | Test | `1`–`4` pick an answer, `Enter` next question |

## Running the project

You need **Python 3** and **Node.js**. Use two terminals.

**1. Server** (runs on http://localhost:5000)

The data is stored in a MySQL database on [TiDB Cloud](https://tidbcloud.com) (free tier). First time only:
1. Copy `server/.env.example` to `server/.env` and fill in your TiDB connection details.
2. Install packages and create the tables (this also loads the starting data from `server/data/`):
   ```
   cd server
   pip install -r requirements.txt
   python setup_database.py
   ```

Then, every time:
```
cd server
python app.py
```

**2. Webpage** (open http://localhost:5173)
```
cd client
npm install                       # first time only
npm run dev
```

The webpage's dev server forwards every `/api/...` request to Flask, so both must be running.

## Running the tests

The server has automated tests for the deck helpers and the `/api/decks` routes. The route tests use a **separate test database** (`TEST_DB_NAME` in `server/.env`), so they never change the real decks. Without a database set up, they are skipped.

```
cd server
python -m pytest
```

## Project layout

## Deploying to Vercel

`vercel.json` builds the webpage and runs the Flask server as a serverless function (`api/index.py`).
1. In the Vercel project settings, set **Root Directory** to the repo root (leave it blank).
2. Under **Environment Variables**, add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` (the same values as `server/.env`).
3. Redeploy.

## Project layout

```
CadetPortal/
├── api/index.py             # Vercel entry point (loads server/app.py)
├── vercel.json              # Vercel build + routing settings
├── server/                  # Flask backend
│   ├── app.py               # Starts the server and defines the API routes
│   ├── db.py                # Connects to the MySQL database
│   ├── storage.py           # Every query that reads or saves data
│   ├── decks.py             # Study deck input checks and edit codes
│   ├── setup_database.py    # Creates the tables and loads the starting data
│   ├── conftest.py          # Test setup (separate test database)
│   ├── tests/               # Automated tests (pytest)
│   └── data/                # Starting data (JSON) for setup_database.py
└── client/                  # React frontend
    └── src/
        ├── App.jsx          # Top bar + page routes
        ├── studyHelpers.js  # Shared helpers for the study modes
        └── components/      # One component per file
```

## API

| Method | URL | What it does |
|---|---|---|
| GET | `/api/links` | Quick links |
| GET | `/api/ferry` | Ferry schedule |
| GET | `/api/shuttle` | Shuttle schedule |
| GET | `/api/uod` | Uniform of the Day |
| GET | `/api/announcements` | Announcements |
| GET | `/api/decks?search=...` | Search decks (summaries only) |
| GET | `/api/decks/<id>` | One full deck with its cards |
| POST | `/api/decks` | Create a deck (needs a new edit code) |
| PUT | `/api/decks/<id>` | Update a deck (needs its edit code) |
| DELETE | `/api/decks/<id>` | Delete a deck (needs its edit code) |

Every route returns JSON. Errors look like `{ "error": "..." }`.
