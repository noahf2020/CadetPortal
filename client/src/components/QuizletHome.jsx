/**
 * QuizletHome.jsx
 *
 * The main study decks page (URL "/quizlet"). Cadets can search decks by
 * title, class, or instructor, open a deck, or make a new one.
 * The data comes from GET /api/decks?search=...
 */

import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fetchJson } from "../api.js";

/**
 * QuizletHome - a search box and a grid of matching decks.
 * @returns The study decks search page.
 */
function QuizletHome() {
  // What the cadet has typed in the search box.
  const [searchText, setSearchText] = useState("");
  // The decks that match the search. It is null until the server responds.
  const [decks, setDecks] = useState(null);
  // A message to show if the decks could not be loaded.
  const [errorMessage, setErrorMessage] = useState("");

  // Ask the server for matching decks every time the search text changes.
  useEffect(() => {
    // encodeURIComponent makes spaces and symbols safe to put in a URL.
    fetchJson("/api/decks?search=" + encodeURIComponent(searchText))
      .then((data) => {
        setDecks(data);
        setErrorMessage("");
      })
      .catch((error) => setErrorMessage("Couldn't load decks. " + error.message));
  }, [searchText]);

  return (
    <main className="page">
      <div className="quizlet-header">
        <div>
          <h1 className="page-title">Study Decks</h1>
          <p className="muted">Flashcards for your classes, made by cadets.</p>
        </div>
        <Link to="/quizlet/new" className="button">
          + New deck
        </Link>
      </div>

      <input
        className="search-box"
        type="search"
        placeholder="Search by class (CY300), instructor (MAJ Jones), or topic..."
        value={searchText}
        onChange={(event) => setSearchText(event.target.value)}
      />

      {errorMessage !== "" && <p className="error-message" role="alert">{errorMessage}</p>}
      {/* While there is an error and no decks were ever loaded, don't show "Loading..." forever. */}
      {!(errorMessage !== "" && decks === null) && <DeckList decks={decks} />}
    </main>
  );
}

/**
 * DeckList - shows the search results as a grid of clickable deck tiles.
 * @param {Object} props
 * @param {Array|null} props.decks - The deck summaries, or null while loading.
 * @returns The grid of decks, or a loading / "no results" message.
 */
function DeckList({ decks }) {
  if (decks === null) {
    return <p className="muted">Loading...</p>;
  }

  if (decks.length === 0) {
    return <p className="muted">No decks found. Try a different search, or make a new deck.</p>;
  }

  return (
    <div className="deck-grid">
      {decks.map((deck) => (
        <Link key={deck.id} to={"/quizlet/" + deck.id} className="card deck-tile">
          <div className="chips">
            <span className="chip">{deck.course}</span>
            {/* Only show the instructor chip if the deck has an instructor. */}
            {deck.instructor !== "" && <span className="chip">{deck.instructor}</span>}
          </div>
          <h3>{deck.title}</h3>
          <p className="muted small">{deck.description}</p>
          <p className="muted small">{deck.card_count} cards</p>
        </Link>
      ))}
    </div>
  );
}

export default QuizletHome;
