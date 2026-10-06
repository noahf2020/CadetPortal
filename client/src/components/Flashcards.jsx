/**
 * Flashcards.jsx
 *
 * The Flashcards study mode. Cadets see one card at a time, click it to
 * flip between the term and the definition, and move to the next or
 * previous card. They can also shuffle the deck.
 */

import { useState } from "react";

/**
 * shuffleCards - makes a shuffled copy of a list of cards.
 * It uses the Fisher-Yates method: go from the end of the list to the start,
 * and swap each card with a random card at or before it.
 * @param {Array} cards - The cards to shuffle.
 * @returns {Array} A new list with the same cards in random order.
 */
function shuffleCards(cards) {
  const shuffled = [...cards]; // copy, so the original list is not changed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temporary = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temporary;
  }
  return shuffled;
}

/**
 * Flashcards - shows a deck one card at a time.
 * @param {Object} props
 * @param {Array} props.cards - The deck's cards, each { term, definition }.
 * @returns The flashcard, its controls, and a progress counter.
 */
function Flashcards({ cards }) {
  // The cards in the order they are being studied (normal or shuffled).
  const [studyCards, setStudyCards] = useState(cards);
  // Which card is showing, starting at 0.
  const [currentIndex, setCurrentIndex] = useState(0);
  // true when the definition side is showing.
  const [showingDefinition, setShowingDefinition] = useState(false);

  const currentCard = studyCards[currentIndex];
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === studyCards.length - 1;

  /** Flip the current card to its other side. */
  function flipCard() {
    setShowingDefinition(!showingDefinition);
  }

  /** Move to the next card, showing its term side first. */
  function goToNextCard() {
    if (!isLastCard) {
      setCurrentIndex(currentIndex + 1);
      setShowingDefinition(false);
    }
  }

  /** Move back to the previous card, showing its term side first. */
  function goToPreviousCard() {
    if (!isFirstCard) {
      setCurrentIndex(currentIndex - 1);
      setShowingDefinition(false);
    }
  }

  /** Shuffle the cards and start again from the first one. */
  function shuffleDeck() {
    setStudyCards(shuffleCards(cards));
    setCurrentIndex(0);
    setShowingDefinition(false);
  }

  /** Put the cards back in their original order and start again. */
  function resetDeck() {
    setStudyCards(cards);
    setCurrentIndex(0);
    setShowingDefinition(false);
  }

  return (
    <section className="flashcards">
      {/* The "flipped" class turns the card around to show the back side. */}
      <button
        className={showingDefinition ? "flashcard flipped" : "flashcard"}
        onClick={flipCard}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className="carousel-category">Term</span>
            <p>{currentCard.term}</p>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="carousel-category">Definition</span>
            <p>{currentCard.definition}</p>
          </div>
        </div>
      </button>
      <p className="muted small center-text">Click the card to flip it.</p>

      <div className="flashcard-controls">
        <button className="button secondary" onClick={resetDeck}>
          Reset
        </button>
        <button className="carousel-arrow dark" onClick={goToPreviousCard} disabled={isFirstCard}>
          ◀
        </button>
        <span className="flashcard-count">
          {currentIndex + 1} / {studyCards.length}
        </span>
        <button className="carousel-arrow dark" onClick={goToNextCard} disabled={isLastCard}>
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
