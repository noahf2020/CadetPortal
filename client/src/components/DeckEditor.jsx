/**
 * DeckEditor.jsx
 *
 * The form for making a new deck (URL "/quizlet/new") or editing one
 * (URL "/quizlet/:deckId/edit").
 *   - New deck:  sends POST /api/decks. The cadet picks an edit code.
 *   - Copy deck: a new deck that starts filled in with another deck's details.
 *                The deck page's "Make a copy" button opens "/quizlet/new"
 *                and passes the deck along as { copyFrom: deck }.
 *   - Edit deck: loads GET /api/decks/:deckId, then sends PUT (save) or
 *                DELETE (delete). The cadet must type the deck's edit code.
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

/**
 * makeBlankCard - creates an empty card for a new row in the form.
 * @returns {Object} A card with an empty term and definition.
 */
function makeBlankCard() {
  return { term: "", definition: "" };
}

// The separators a cadet can pick when importing a .txt file.
// "custom" means: use whatever the cadet types in the custom box.
const SEPARATOR_OPTIONS = {
  tab: "\t",
  comma: ",",
  dash: " - ",
  custom: "",
};

/**
 * parseCardsFromText - turns the text of an imported file into cards.
 * Each line is one card. The term is everything before the FIRST separator,
 * and the definition is everything after it (so definitions may contain the separator).
 * @param {string} text - The full text of the file.
 * @param {string} separator - What splits the term from the definition (e.g. a tab).
 * @returns {Object} { cards: [...], skippedLines: number } - the cards found, and how
 *   many non-empty lines had no separator and were skipped.
 */
function parseCardsFromText(text, separator) {
  const importedCards = [];
  let skippedLines = 0;

  // Windows files end lines with "\r\n", others with "\n". Split on either.
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    // Skip blank lines.
    if (line.trim() === "") {
      continue;
    }

    const separatorIndex = line.indexOf(separator);
    if (separatorIndex === -1) {
      skippedLines = skippedLines + 1;
      continue;
    }

    const term = line.slice(0, separatorIndex).trim();
    const definition = line.slice(separatorIndex + separator.length).trim();
    importedCards.push({ term: term, definition: definition });
  }

  return { cards: importedCards, skippedLines: skippedLines };
}

/**
 * isBlankCard - checks if a card has no term and no definition.
 * @param {Object} card - The card to check.
 * @returns {boolean} True if both fields are empty.
 */
function isBlankCard(card) {
  return card.term.trim() === "" && card.definition.trim() === "";
}

/**
 * DeckEditor - the create / edit deck form.
 * @returns The deck form page.
 */
function DeckEditor() {
  // The deck id from the URL. It is undefined on the "new deck" page.
  const { deckId } = useParams();
  const isEditing = deckId !== undefined;
  // navigate("/some/url") sends the cadet to another page.
  const navigate = useNavigate();
  // The deck to copy, if the cadet clicked "Make a copy" on a deck page.
  // location.state is whatever the link passed along (null if nothing).
  const location = useLocation();
  let copyFrom = null;
  if (!isEditing && location.state && location.state.copyFrom) {
    copyFrom = location.state.copyFrom;
  }

  // One piece of state for each form field. A copy starts with the other
  // deck's details; a brand new deck starts empty.
  const [title, setTitle] = useState(copyFrom ? "Copy of " + copyFrom.title : "");
  const [course, setCourse] = useState(copyFrom ? copyFrom.course : "");
  const [instructor, setInstructor] = useState(copyFrom ? copyFrom.instructor : "");
  const [description, setDescription] = useState(copyFrom ? copyFrom.description : "");
  const [cards, setCards] = useState(copyFrom ? copyFrom.cards : [makeBlankCard(), makeBlankCard()]);
  const [editCode, setEditCode] = useState("");
  // A message from the server if saving fails, e.g. "Title is required."
  const [errorMessage, setErrorMessage] = useState("");
  // Import from .txt: which separator is picked (defaults to tab), the text of a
  // custom separator, and a message saying how the last import went.
  const [separatorChoice, setSeparatorChoice] = useState("tab");
  const [customSeparator, setCustomSeparator] = useState("");
  const [importMessage, setImportMessage] = useState("");
  // The text in the bulk paste box.
  const [pastedText, setPastedText] = useState("");

  // When editing, load the deck once and fill in the form with its details.
  useEffect(() => {
    if (!isEditing) {
      return;
    }
    fetch("/api/decks/" + deckId)
      .then((response) => response.json())
      .then((deck) => {
        if (deck.error) {
          setErrorMessage(deck.error);
          return;
        }
        setTitle(deck.title);
        setCourse(deck.course);
        setInstructor(deck.instructor);
        setDescription(deck.description);
        setCards(deck.cards);
      })
      .catch((error) => console.error("Could not load deck:", error));
  }, [deckId, isEditing]);

  /**
   * Change the term or the definition of one card.
   * @param {number} index - Which card to change.
   * @param {string} field - Either "term" or "definition".
   * @param {string} value - The new text.
   */
  function updateCard(index, field, value) {
    const updatedCards = [...cards]; // copy, because React state must not be changed directly
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setCards(updatedCards);
  }

  /** Add an empty card row to the end of the form. */
  function addCard() {
    setCards([...cards, makeBlankCard()]);
  }

  /**
   * Remove one card row from the form.
   * @param {number} index - Which card to remove.
   */
  function removeCard(index) {
    const remainingCards = [];
    for (let i = 0; i < cards.length; i++) {
      if (i !== index) {
        remainingCards.push(cards[i]);
      }
    }
    setCards(remainingCards);
  }

  /**
   * Get the separator the cadet picked in the dropdown (or typed in the custom box).
   * @returns {string} The separator, or "" if "Custom" is picked but nothing is typed.
   */
  function getSeparator() {
    if (separatorChoice === "custom") {
      return customSeparator;
    }
    return SEPARATOR_OPTIONS[separatorChoice];
  }

  /**
   * Turn imported text (from a file or a paste) into cards and add them to the form.
   * Empty card rows in the form are dropped so the imported cards don't sit
   * below blank rows. Cards the cadet already typed are kept.
   * @param {string} text - The text to import, one card per line.
   * @returns {boolean} True if at least one card was added.
   */
  function addCardsFromText(text) {
    const separator = getSeparator();
    if (separator === "") {
      setImportMessage("Type a custom separator before importing.");
      return false;
    }

    const result = parseCardsFromText(text, separator);
    if (result.cards.length === 0) {
      setImportMessage("No cards found. Check that the separator matches your text.");
      return false;
    }

    // Keep only the cards that already have something typed in them.
    const filledCards = [];
    for (const card of cards) {
      if (!isBlankCard(card)) {
        filledCards.push(card);
      }
    }
    setCards([...filledCards, ...result.cards]);

    let message = "Imported " + result.cards.length + " card(s).";
    if (result.skippedLines > 0) {
      message = message + " Skipped " + result.skippedLines + " line(s) with no separator.";
    }
    setImportMessage(message);
    return true;
  }

  /**
   * Read a .txt file the cadet picked and add its lines as cards.
   * @param {Event} event - The file input's change event.
   */
  function importFromFile(event) {
    const file = event.target.files[0];
    // Clear the input so picking the same file again still triggers an import.
    event.target.value = "";
    if (!file) {
      return;
    }

    // FileReader reads the file in the browser. onload runs once it is done.
    const reader = new FileReader();
    reader.onload = () => addCardsFromText(reader.result);
    reader.onerror = () => setImportMessage("Could not read that file.");
    reader.readAsText(file);
  }

  /** Add the cards from the bulk paste box, then empty the box if it worked. */
  function importFromPaste() {
    const added = addCardsFromText(pastedText);
    if (added) {
      setPastedText("");
    }
  }

  /**
   * Send the form to the server. On success, go to the deck's page.
   * @param {Event} event - The form's submit event.
   */
  function saveDeck(event) {
    // Stop the browser from reloading the page, which forms do by default.
    event.preventDefault();

    const deckData = {
      title: title,
      course: course,
      instructor: instructor,
      description: description,
      cards: cards,
      edit_code: editCode,
    };

    // New decks are created with POST. Existing decks are replaced with PUT.
    const url = isEditing ? "/api/decks/" + deckId : "/api/decks";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deckData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
        } else {
          navigate("/quizlet/" + data.id);
        }
      })
      .catch((error) => console.error("Could not save deck:", error));
  }

  /** Delete the deck (after asking the cadet to confirm), then go back to the deck list. */
  function deleteDeck() {
    if (!window.confirm("Delete this deck for everyone? This cannot be undone.")) {
      return;
    }

    fetch("/api/decks/" + deckId, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edit_code: editCode }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setErrorMessage(data.error);
        } else {
          navigate("/quizlet");
        }
      })
      .catch((error) => console.error("Could not delete deck:", error));
  }

  // Where the "Cancel" link goes: back to the deck, or back to the deck list.
  const cancelUrl = isEditing ? "/quizlet/" + deckId : "/quizlet";

  return (
    <main className="page">
      <Link to={cancelUrl} className="back-link">← Cancel</Link>
      <h1 className="page-title">{isEditing ? "Edit deck" : "New deck"}</h1>
      {copyFrom && (
        <p className="muted">
          Copying "{copyFrom.title}". Change anything you like, then pick your own edit code.
        </p>
      )}

      <form className="card deck-form" onSubmit={saveDeck}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Military Ranks" />
        </label>

        <div className="form-row">
          <label>
            Class
            <input value={course} onChange={(event) => setCourse(event.target.value)} placeholder="CY300" />
          </label>
          <label>
            Instructor (optional)
            <input value={instructor} onChange={(event) => setInstructor(event.target.value)} placeholder="MAJ Jones" />
          </label>
        </div>

        <label>
          Description (optional)
          <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this deck cover?" />
        </label>

        <p className="card-label">Cards</p>

        {/* Import cards from a .txt file: one card per line, term and definition split by a separator. */}
        <div className="import-box">
          <div className="form-row">
            <label>
              Split term and definition by
              <select value={separatorChoice} onChange={(event) => setSeparatorChoice(event.target.value)}>
                <option value="tab">Tab</option>
                <option value="comma">Comma ( , )</option>
                <option value="dash">Dash ( - )</option>
                <option value="custom">Custom…</option>
              </select>
            </label>
            {separatorChoice === "custom" && (
              <label>
                Custom separator
                <input
                  value={customSeparator}
                  onChange={(event) => setCustomSeparator(event.target.value)}
                  placeholder="e.g. ;"
                />
              </label>
            )}
          </div>
          <label>
            Import from .txt file
            <input type="file" accept=".txt,text/plain" onChange={importFromFile} />
          </label>
          <label>
            Or paste cards
            <textarea
              rows={5}
              value={pastedText}
              onChange={(event) => setPastedText(event.target.value)}
              placeholder={"SPC\tSpecialist\nSGT\tSergeant"}
            />
          </label>
          <button
            type="button"
            className="button secondary"
            onClick={importFromPaste}
            disabled={pastedText.trim() === ""}
          >
            Add pasted cards
          </button>
          <span className="muted small">One card per line. Imported cards are added after any cards you already typed.</span>
          {/* aria-live makes screen readers announce the message when it changes. */}
          <span className="small" aria-live="polite">{importMessage}</span>
        </div>

        {cards.map((card, index) => (
          <div key={index} className="card-row">
            <span className="card-number">{index + 1}</span>
            <input
              value={card.term}
              onChange={(event) => updateCard(index, "term", event.target.value)}
              placeholder="Term"
              aria-label={"Card " + (index + 1) + " term"}
            />
            <input
              value={card.definition}
              onChange={(event) => updateCard(index, "definition", event.target.value)}
              placeholder="Definition"
              aria-label={"Card " + (index + 1) + " definition"}
            />
            <button
              type="button"
              className="remove-button"
              onClick={() => removeCard(index)}
              title="Remove card"
              aria-label={"Remove card " + (index + 1)}
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="button secondary" onClick={addCard}>
          + Add card
        </button>

        <label>
          Edit code
          <input
            type="password"
            value={editCode}
            onChange={(event) => setEditCode(event.target.value)}
            placeholder={isEditing ? "The code chosen when this deck was made" : "Pick a code (at least 4 characters)"}
          />
          <span className="muted small">
            {isEditing
              ? "You need the deck's edit code to save changes or delete it."
              : "Remember this code. You will need it to edit or delete the deck later."}
          </span>
        </label>

        {errorMessage !== "" && <p className="error-message" role="alert">{errorMessage}</p>}

        <div className="form-buttons">
          <button type="submit" className="button">
            {isEditing ? "Save changes" : "Create deck"}
          </button>
          {isEditing && (
            <button type="button" className="button danger" onClick={deleteDeck}>
              Delete deck
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

export default DeckEditor;
