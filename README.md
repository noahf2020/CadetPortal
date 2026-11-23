# CadetPortal

A web portal for West Point cadets: one place for the links and daily information that matter in cadet life, plus **Study Decks**, a cadet-made flashcard tool.

Built for CY300 with a **Python Flask** server, a **React** webpage, and a **MySQL** database.
Live site: https://usma-cadet-portal.vercel.app

## Features

**Portal home page**
- Quick Links to common cadet services
- Uniform of the Day, with a "Last updated" date and a warning when it wasn't updated today
- Ferry hours and shuttle times
- Announcements

**Study Decks (`/quizlet`)**
- Search decks by class, instructor, topic, or any term inside a deck
- Make, edit, copy, and delete decks (no login: each deck has its own **edit code**, stored hashed)
- Bulk-add cards by pasting or from a `.txt` file: one card per line, split by tab (default), comma, dash, or a custom separator. A **preview** shows the cards before they are added and lists any malformed lines by line number.
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

Every page shows a clear message if the server can't be reached or a save fails, so cadets know to retry.

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.10 or newer | `python --version` |
| Node.js (includes npm) | 20.19 or newer (Vite 7 needs it) | `node --version` |
| A MySQL database | TiDB Cloud (free) or local, see step 1 | |

### Dependencies

**Server (Python)**, listed in `server/requirements.txt`:

| Package | What it's for |
|---|---|
| `flask` | The web server and API routes |
| `pymysql` | Talks to the MySQL database |
| `certifi` | Trusted certificates for the encrypted (SSL) database connection |
| `python-dotenv` | Reads database settings from `server/.env` |
| `pytest` | Runs the automated tests (not needed by the running server) |

**Webpage (JavaScript)**, listed in `client/package.json`:

| Package | Version | What it's for |
|---|---|---|
| `react`, `react-dom` | 19 | The user interface |
| `react-router` | 8 | Page addresses (`/`, `/quizlet`, `/quizlet/3`, ...) |
| `vite` | 7 | Development server and production build (dev only) |
| `@vitejs/plugin-react` | 5 | Lets Vite build React code (dev only) |

## Running the project (clean checkout)

Use two terminals: one for the server, one for the webpage.

### 1. Set up the database (first time only)

The server reads its database settings from `server/.env`. This file holds a password, so it is **never committed**. Copy the template:

```
cd server
copy .env.example .env        # Mac/Linux: cp .env.example .env
```

Then fill in `server/.env` using **one** of these options:

- **Option A: the team's shared TiDB Cloud database.** Get the host, user, and password from a teammate in person or by direct message (never in git or a group chat). Use `DB_NAME=cadet_portal`.
- **Option B: your own free TiDB Cloud database.** Sign up at https://tidbcloud.com and create a **Serverless** cluster. Then open **Connect**, choose "General", and copy the host, port, user, and password.
- **Option C: a local database with Docker** (no account needed):
  ```
  docker run -d --name cadetportal-db -p 4000:4000 pingcap/tidb:v8.5.1
  ```
  and in `server/.env` set:
  ```
  DB_HOST=127.0.0.1
  DB_PORT=4000
  DB_USER=root
  DB_PASSWORD=
  DB_SSL=false
  ```

Keep `TEST_DB_NAME` different from `DB_NAME`, because the tests empty the deck tables in the test database.

### 2. Server (runs on http://localhost:5000)

First time only: install the packages, then create the tables and add the starting data (quick links, ferry and shuttle schedules, and two example decks from `server/starting_data.py`):
```
cd server
python -m pip install -r requirements.txt
python setup_database.py
```

Every time:
```
cd server
python app.py
```

### 3. Webpage (open http://localhost:5173)

```
cd client
npm install        # first time only
npm run dev
```

The webpage's dev server forwards every `/api/...` request to Flask, so both must be running.

### 4. Check that it works

1. Open http://localhost:5173. You should see the quick links, ferry, and shuttle times. A new database has no UOD or announcements yet: set the UOD with `python update_uod.py "Class B"` (see below).
2. Go to **Study Decks**, then **+ New deck**. Paste a few `term<TAB>definition` lines, click **Preview pasted cards**, then **Add**. Pick an edit code and click **Create deck**.
3. Reload the deck page. The deck is still there.
4. Go back to **Study Decks** and search for one of your terms. The deck shows up.
5. Open it and try **Flashcards**, **Learn**, and **Test**.

## Updating the Uniform of the Day

The UOD is updated by hand for now (the email fetch is waiting on access approval). From the `server` folder:

```
python update_uod.py "Class B"
python update_uod.py "ACUs" "Bring a fleece; rain expected after 1500."
```

It saves the uniform with today's date, and the portal shows that date as **Last updated**. If the UOD wasn't updated today, the portal shows a warning telling cadets to confirm with their chain of command. Run `python update_uod.py` with no words after it to see the current UOD.

This uses the database in `server/.env`. If that is the team's shared database, the change shows on the live site right away.

## Running the tests

```
cd server
python -m pytest
```

The tests cover the deck checks, the `/api/decks` routes, and UOD updates. The database tests use a **separate test database** (`TEST_DB_NAME` in `server/.env`), so they never change real data. If no database is set up, they are skipped.

If typing just `pytest` gives "not recognized", use `python -m pytest`. That happens when Python's Scripts folder isn't on your PATH.

## Deploying to Vercel

`vercel.json` builds the webpage and runs the Flask server as a serverless function (`api/index.py`).
1. In the Vercel project settings, set **Root Directory** to the repo root (leave it blank).
2. Under **Environment Variables**, add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` (the same values as `server/.env`, with `DB_NAME=cadet_portal`).
3. Redeploy. Changed variables only take effect on a new deployment.

## Project layout

```
CadetPortal/
├── api/index.py             # Vercel entry point (loads server/app.py)
├── vercel.json              # Vercel build + routing settings
├── requirements.txt         # Python packages for Vercel (same as server/, minus pytest)
├── server/                  # Flask backend
│   ├── app.py               # Starts the server and defines the API routes
│   ├── db.py                # Connects to the MySQL database
│   ├── storage.py           # Every query that reads or saves data
│   ├── decks.py             # Study deck input checks and edit codes
│   ├── setup_database.py    # Creates the tables and adds the starting data
│   ├── starting_data.py     # The data a new database starts with
│   ├── update_uod.py        # Manually updates the Uniform of the Day
│   ├── .env.example         # Template for server/.env (database settings)
│   ├── conftest.py          # Test setup (separate test database)
│   └── tests/               # Automated tests (pytest)
└── client/                  # React frontend
    ├── package.json         # Frontend dependencies
    └── src/
        ├── App.jsx          # Top bar + page routes
        ├── api.js           # fetchJson: calls the server, turns failures into clear messages
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
