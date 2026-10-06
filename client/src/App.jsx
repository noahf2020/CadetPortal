/**
 * App.jsx
 *
 * The main layout of the Cadet Portal:
 *   1. A top bar with the portal name and today's date (on every page).
 *   2. The page that matches the URL:
 *        /                        -> the portal home page
 *        /quizlet                 -> search all study decks
 *        /quizlet/new             -> make a new deck
 *        /quizlet/:deckId         -> study one deck with flashcards
 *        /quizlet/:deckId/edit    -> edit one deck
 */

import { Link, Route, Routes } from "react-router";
import HomePage from "./components/HomePage.jsx";
import QuizletHome from "./components/QuizletHome.jsx";
import DeckView from "./components/DeckView.jsx";
import DeckEditor from "./components/DeckEditor.jsx";

/**
 * App - the top-level component of the portal.
 * @returns The top bar plus the page for the current URL.
 */
function App() {
  // Today's date written out, e.g. "Thursday, October 1".
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          {/* Clicking the portal name always goes back to the home page. */}
          <Link to="/" className="brand">
            {/* Small gold square with the portal's initials. */}
            <span className="brand-mark">CP</span>
            <span className="brand-name">Cadet Portal</span>
          </Link>
          <span className="topbar-date">{today}</span>
        </div>
      </header>

      {/* Show only the one Route whose "path" matches the URL. */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quizlet" element={<QuizletHome />} />
        <Route path="/quizlet/new" element={<DeckEditor />} />
        <Route path="/quizlet/:deckId" element={<DeckView />} />
        <Route path="/quizlet/:deckId/edit" element={<DeckEditor />} />
      </Routes>
    </div>
  );
}

export default App;
