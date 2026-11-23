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
```
cd server
pip install -r requirements.txt   # first time only
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

The server has automated tests for the deck helpers and the `/api/decks` routes. They use a temporary data folder, so they never change the real decks.

```
cd server
python -m pytest
```

## Project layout

```
CadetPortal/
├── server/                  # Flask backend
│   ├── app.py               # Starts the server and defines the API routes
│   ├── storage.py           # Reads and writes the JSON data files
│   ├── decks.py             # Study deck helpers (search, checks, edit codes)
│   ├── conftest.py          # Test setup (temporary data folder)
│   ├── tests/               # Automated tests (pytest)
│   └── data/                # JSON data files (decks.json, links.json, ...)
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
