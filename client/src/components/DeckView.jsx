/**
 * DeckView.jsx
 *
 * The page for one deck (URL "/quizlet/:deckId"). It shows the deck's
 * details, the Flashcards study mode, and a list of every term.
 * The data comes from GET /api/decks/:deckId
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Flashcards from "./Flashcards.jsx";

/**
 * DeckView - loads one deck from the server and shows it.
 * @returns The deck page.
 */
function DeckView() {
  // The deck id from the URL, e.g. "2" for /quizlet/2.
  const { deckId } = useParams();
  // The deck data. It is null until the server responds.
  const [deck, setDeck] = useState(null);
  // An error message if the deck could not be loaded.
  const [errorMessage, setErrorMessage] = useState("");

  // Ask the server for this deck when the page appears (or the id changes).
  useEffect(() => {
    fetch("/api/decks/" + deckId)
      .then((response) => response.json())
      .then((data) => {
        // The server sends { "error": "..." } if the deck does not exist.
        if (data.error) {
          setErrorMessage(data.error);
        } else {
          setDeck(data);
        }
      })
      .catch((error) => console.error("Could not load deck:", error));
  }, [deckId]);

  if (errorMessage !== "") {
    return (
      <main className="page">
        <p>{errorMessage}</p>
        <Link to="/quizlet">← Back to all decks</Link>
      </main>
    );
  }

  if (deck === null) {
    return (
      <main className="page">
        <p className="muted">Loading...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <Link to="/quizlet" className="back-link">← All decks</Link>

      <div className="quizlet-header">
        <div>
          <h1 className="page-title">{deck.title}</h1>
          <div className="chips">
            <span className="chip">{deck.course}</span>
            {deck.instructor !== "" && <span className="chip">{deck.instructor}</span>}
          </div>
          <p className="muted">{deck.description}</p>
        </div>
        <Link to={"/quizlet/" + deck.id + "/edit"} className="button secondary">
          Edit deck
        </Link>
      </div>

      <Flashcards cards={deck.cards} />

      <section className="card">
        <p className="card-label">All terms ({deck.cards.length})</p>
        {deck.cards.map((card, index) => (
          <div key={index} className="term-row">
            <span className="term-word">{card.term}</span>
            <span>{card.definition}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

export default DeckView;
