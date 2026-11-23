/**
 * DeckView.jsx
 *
 * The page for one deck (URL "/quizlet/:deckId"). It shows:
 *   - the deck's details, with buttons to edit, copy, or export the deck,
 *   - a study mode (Flashcards, Learn, or Test), picked with tabs,
 *   - a switch to study definition-first instead of term-first,
 *   - a list of every term (Flashcards mode only, hidden until opened).
 * The data comes from GET /api/decks/:deckId
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Flashcards from "./Flashcards.jsx";
import Learn from "./Learn.jsx";
import Test from "./Test.jsx";
import { downloadTextFile, makeDeckText } from "../studyHelpers.js";
import { fetchJson } from "../api.js";

// The study mode tabs, in the order they appear.
const STUDY_MODES = [
  { id: "flashcards", label: "Flashcards" },
  { id: "learn", label: "Learn" },
  { id: "test", label: "Test" },
];

/**
 * makeStudyCards - turns the deck's cards into { front, back } cards for the
 * study modes, so the modes don't need to know which way round they are.
 * @param {Array} cards - The deck's cards, each { term, definition }.
 * @param {boolean} definitionFirst - true to put the definition on the front.
 * @returns {Array} The cards, each { front, back }.
 */
function makeStudyCards(cards, definitionFirst) {
  const studyCards = [];
  for (const card of cards) {
    if (definitionFirst) {
      studyCards.push({ front: card.definition, back: card.term });
    } else {
      studyCards.push({ front: card.term, back: card.definition });
    }
  }
  return studyCards;
}

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
  // Which study mode is showing: "flashcards", "learn", or "test".
  const [studyMode, setStudyMode] = useState("flashcards");
  // true to show the definition first and ask for the term.
  const [definitionFirst, setDefinitionFirst] = useState(false);
  // true when the "All terms" list is open. It starts closed so answers stay hidden.
  const [showingAllTerms, setShowingAllTerms] = useState(false);

  // Ask the server for this deck when the page appears (or the id changes).
  useEffect(() => {
    fetchJson("/api/decks/" + deckId)
      .then((data) => setDeck(data))
      // e.g. "Deck not found." (404) or "Couldn't reach the server..."
      .catch((error) => setErrorMessage("Couldn't load this deck. " + error.message));
  }, [deckId]);

  if (errorMessage !== "") {
    return (
      <main className="page">
        <Link to="/quizlet" className="back-link">← All decks</Link>
        <p className="error-message" role="alert">{errorMessage}</p>
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

  /** Download the deck as a tab-separated .txt file (the same format the editor imports). */
  function exportDeck() {
    // Remove characters that aren't allowed in file names, like / and ?.
    const safeTitle = deck.title.replace(/[\\/:*?"<>|]+/g, "").trim();
    downloadTextFile((safeTitle || "deck") + ".txt", makeDeckText(deck.cards));
  }

  const studyCards = makeStudyCards(deck.cards, definitionFirst);
  const frontLabel = definitionFirst ? "Definition" : "Term";
  const backLabel = definitionFirst ? "Term" : "Definition";
  // Changing this "key" makes React start the study mode over from scratch,
  // which is what we want when the cadet switches modes or flips the direction.
  const studyKey = studyMode + "-" + definitionFirst;
  // Learn progress is saved separately for each deck and each direction.
  const learnSaveKey = "learn-progress-deck-" + deck.id + (definitionFirst ? "-definition-first" : "-term-first");

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
        <div className="deck-actions">
          <Link to={"/quizlet/" + deck.id + "/edit"} className="button secondary">
            Edit deck
          </Link>
          {/* "state" passes the deck to the new-deck form, which fills itself in with it. */}
          <Link to="/quizlet/new" state={{ copyFrom: deck }} className="button secondary">
            Make a copy
          </Link>
          <button className="button secondary" onClick={exportDeck}>
            Export .txt
          </button>
        </div>
      </div>

      <div className="study-options">
        {/* Tabs to switch between study modes. */}
        <div className="mode-tabs" role="tablist" aria-label="Study mode">
          {STUDY_MODES.map((mode) => (
            <button
              key={mode.id}
              role="tab"
              aria-selected={studyMode === mode.id}
              className={studyMode === mode.id ? "mode-tab active" : "mode-tab"}
              onClick={() => setStudyMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={definitionFirst}
            onChange={(event) => setDefinitionFirst(event.target.checked)}
          />
          Show definition first
        </label>
      </div>

      {studyMode === "flashcards" && (
        <Flashcards key={studyKey} cards={studyCards} frontLabel={frontLabel} backLabel={backLabel} />
      )}
      {studyMode === "learn" && (
        <Learn key={studyKey} cards={studyCards} frontLabel={frontLabel} backLabel={backLabel} saveKey={learnSaveKey} />
      )}
      {studyMode === "test" && (
        <Test key={studyKey} cards={studyCards} frontLabel={frontLabel} backLabel={backLabel} />
      )}

      {/* The list of every term and definition. It is hidden until the cadet asks
          for it, and only offered in Flashcards mode, so it can't give away answers. */}
      {studyMode === "flashcards" && (
        <section className="card">
          <div className="terms-header">
            <p className="card-label">All terms ({deck.cards.length})</p>
            <button
              className="button secondary"
              onClick={() => setShowingAllTerms(!showingAllTerms)}
              aria-expanded={showingAllTerms}
            >
              {showingAllTerms ? "Hide terms" : "Show terms"}
            </button>
          </div>
          {showingAllTerms &&
            deck.cards.map((card, index) => (
              <div key={index} className="term-row">
                <span className="term-word">{card.term}</span>
                <span>{card.definition}</span>
              </div>
            ))}
        </section>
      )}
    </main>
  );
}

export default DeckView;
