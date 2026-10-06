/**
 * DeckEditor.jsx
 *
 * The form for making a new deck (URL "/quizlet/new") or editing one
 * (URL "/quizlet/:deckId/edit").
 *   - New deck:  sends POST /api/decks. The cadet picks an edit code.
 *   - Edit deck: loads GET /api/decks/:deckId, then sends PUT (save) or
 *                DELETE (delete). The cadet must type the deck's edit code.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

/**
 * makeBlankCard - creates an empty card for a new row in the form.
 * @returns {Object} A card with an empty term and definition.
 */
function makeBlankCard() {
  return { term: "", definition: "" };
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

  // One piece of state for each form field.
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [instructor, setInstructor] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState([makeBlankCard(), makeBlankCard()]);
  const [editCode, setEditCode] = useState("");
  // A message from the server if saving fails, e.g. "Title is required."
  const [errorMessage, setErrorMessage] = useState("");

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
        {cards.map((card, index) => (
          <div key={index} className="card-row">
            <span className="card-number">{index + 1}</span>
            <input
              value={card.term}
              onChange={(event) => updateCard(index, "term", event.target.value)}
              placeholder="Term"
            />
            <input
              value={card.definition}
              onChange={(event) => updateCard(index, "definition", event.target.value)}
              placeholder="Definition"
            />
            <button type="button" className="remove-button" onClick={() => removeCard(index)} title="Remove card">
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

        {errorMessage !== "" && <p className="error-message">{errorMessage}</p>}

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
