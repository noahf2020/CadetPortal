/**
 * Flashcards.jsx
 *
 * The Flashcards study mode. Cadets see one card at a time, click it to
 * flip between the front and the back, and move to the next or
 * previous card. They can also shuffle the deck.
 *
 * Keyboard: Space flips the card, Left / Right arrows move between cards.
 */

import { useEffect, useState } from "react";
import { shouldIgnoreKey, shuffleList } from "../studyHelpers.js";

/**
 * Flashcards - shows a deck one card at a time.
 * @param {Object} props
 * @param {Array} props.cards - The cards, each { front, back }.
 * @param {string} props.frontLabel - The small label on the front, e.g. "Term".
 * @param {string} props.backLabel - The small label on the back, e.g. "Definition".
 * @returns The flashcard, its controls, and a progress counter.
 */
function Flashcards({ cards, frontLabel, backLabel }) {
  // The cards in the order they are being studied (normal or shuffled).
  const [studyCards, setStudyCards] = useState(cards);
  // Which card is showing, starting at 0.
  const [currentIndex, setCurrentIndex] = useState(0);
  // true when the back of the card is showing.
  const [showingBack, setShowingBack] = useState(false);
  // Goes up by one every time a different card is shown. It is used as the
  // card's "key", so React draws a fresh card instead of animating the old one
  // back over, which would briefly show the new card's back.
  const [turnNumber, setTurnNumber] = useState(0);

  const currentCard = studyCards[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === studyCards.length - 1;

  /** Flip the current card to its other side. */
  function flipCard() {
    setShowingBack(!showingBack);
  }

  /**
   * Show a card, front side first.
   * @param {number} index - Which card to show.
   */
  function showCard(index) {
    setCurrentIndex(index);
    setShowingBack(false);
    setTurnNumber(turnNumber + 1);
  }

  /** Move to the next card. */
  function goToNextCard() {
    if (!isLastCard) {
      showCard(currentIndex + 1);
    }
  }

  /** Move back to the previous card. */
  function goToPreviousCard() {
    if (!isFirstCard) {
      showCard(currentIndex - 1);
    }
  }

  /** Shuffle the cards and start again from the first one. */
  function shuffleDeck() {
    setStudyCards(shuffleList(cards));
    showCard(0);
  }

  /** Put the cards back in their original order and start again. */
  function resetDeck() {
    setStudyCards(cards);
    showCard(0);
  }

  // Keyboard shortcuts. The listener is added when the component appears and
  // removed when it goes away (the "return" function below). It is re-added
  // whenever the values it uses change, so it always sees the latest state.
  useEffect(() => {
    /**
     * Run the matching action for a key press.
     * @param {KeyboardEvent} event - The key press.
     */
    function handleKeyDown(event) {
      if (shouldIgnoreKey(event)) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault(); // stop Space from scrolling the page
        flipCard();
      } else if (event.key === "ArrowRight") {
        goToNextCard();
      } else if (event.key === "ArrowLeft") {
        goToPreviousCard();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <section className="flashcards">
      {/* The "flipped" class turns the card around to show the back side. */}
      <button
        key={turnNumber}
        className={showingBack ? "flashcard flipped" : "flashcard"}
        onClick={flipCard}
        aria-label={showingBack ? backLabel + ": " + currentCard.back : frontLabel + ": " + currentCard.front}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className="carousel-category">{frontLabel}</span>
            <p>{currentCard.front}</p>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="carousel-category">{backLabel}</span>
            <p>{currentCard.back}</p>
          </div>
        </div>
      </button>
      <p className="muted small center-text">Click the card or press Space to flip it. Use ← → to move.</p>

      <div className="flashcard-controls">
        <button className="button secondary" onClick={resetDeck}>
          Reset
        </button>
        <button
          className="carousel-arrow dark"
          onClick={goToPreviousCard}
          disabled={isFirstCard}
          aria-label="Previous card"
        >
          ◀
        </button>
        <span className="flashcard-count">
          {currentIndex + 1} / {studyCards.length}
        </span>
        <button
          className="carousel-arrow dark"
          onClick={goToNextCard}
          disabled={isLastCard}
          aria-label="Next card"
        >
          ▶
        </button>
        <button className="button secondary" onClick={shuffleDeck}>
          Shuffle
        </button>
      </div>
    </section>
  );
}

export default Flashcards;
