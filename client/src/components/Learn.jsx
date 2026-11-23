/**
 * Learn.jsx
 *
 * The Learn study mode (self-graded). Cadets see the front of a card, flip it
 * to check the back, then say whether they knew it:
 *   - "Got it"         -> the card is learned and leaves the queue.
 *   - "Still learning" -> the card goes to the back of the queue to try again.
 * Learn is finished when every card has been marked "Got it".
 *
 * Progress is saved in the browser (localStorage), so refreshing the page or
 * coming back later picks up where the cadet left off.
 *
 * Keyboard: Space flips the card, 1 = Still learning, 2 = Got it.
 */

import { useEffect, useState } from "react";
import { makeNumberList, shouldIgnoreKey, shuffleList } from "../studyHelpers.js";

/**
 * makeFreshProgress - the starting progress: every card in a random order.
 * Cards are tracked by their position in the deck (0, 1, 2, ...), which is
 * easy to save.
 * @param {number} totalCards - How many cards are in the deck.
 * @returns {Object} { queue, learnedCount, missCount }
 */
function makeFreshProgress(totalCards) {
  return {
    queue: shuffleList(makeNumberList(totalCards)),
    learnedCount: 0,
    missCount: 0,
  };
}

/**
 * loadProgress - reads saved progress from the browser, if there is any.
 * Saved progress is ignored if it doesn't fit the deck any more (for example,
 * if cards were added or removed since it was saved).
 * @param {string} saveKey - The name the progress is saved under.
 * @param {number} totalCards - How many cards are in the deck now.
 * @returns {Object} The saved progress, or fresh progress if none fits.
 */
function loadProgress(saveKey, totalCards) {
  try {
    const savedText = window.localStorage.getItem(saveKey);
    if (savedText === null) {
      return makeFreshProgress(totalCards);
    }

    const saved = JSON.parse(savedText);
    if (saved.totalCards !== totalCards || !Array.isArray(saved.queue)) {
      return makeFreshProgress(totalCards);
    }
    for (const cardNumber of saved.queue) {
      if (cardNumber < 0 || cardNumber >= totalCards) {
        return makeFreshProgress(totalCards);
      }
    }
    return { queue: saved.queue, learnedCount: saved.learnedCount, missCount: saved.missCount };
  } catch {
    // localStorage can be blocked (e.g. private browsing) or the data can be broken.
    return makeFreshProgress(totalCards);
  }
}

/**
 * saveProgress - saves progress in the browser. Finished progress is deleted
 * instead, so the next visit starts fresh.
 * @param {string} saveKey - The name to save the progress under.
 * @param {number} totalCards - How many cards are in the deck.
 * @param {Object} progress - { queue, learnedCount, missCount }
 */
function saveProgress(saveKey, totalCards, progress) {
  try {
    if (progress.queue.length === 0) {
      window.localStorage.removeItem(saveKey);
    } else {
      const toSave = { totalCards: totalCards, ...progress };
      window.localStorage.setItem(saveKey, JSON.stringify(toSave));
    }
  } catch {
    // If saving fails, Learn still works; it just won't remember progress.
  }
}

/**
 * Learn - a self-graded study mode that repeats cards until they are learned.
 * @param {Object} props
 * @param {Array} props.cards - The cards, each { front, back }.
 * @param {string} props.frontLabel - The small label on the front, e.g. "Term".
 * @param {string} props.backLabel - The small label on the back, e.g. "Definition".
 * @param {string} props.saveKey - A unique name for saving this deck's progress.
 * @returns The current card, the grading buttons, and a progress bar.
 */
function Learn({ cards, frontLabel, backLabel, saveKey }) {
  const totalCards = cards.length;

  // All progress in one object: { queue, learnedCount, missCount }.
  //   queue        - card numbers still to learn; the first one is showing.
  //   learnedCount - how many cards were marked "Got it".
  //   missCount    - how many times "Still learning" was pressed.
  // The function form of useState only runs once, when Learn first appears.
  const [progress, setProgress] = useState(() => loadProgress(saveKey, totalCards));
  // true when the back of the card is showing.
  const [showingBack, setShowingBack] = useState(false);
  // Goes up by one every time a card is graded. It is used as the card's "key",
  // so React draws a fresh card instead of animating the old one back over,
  // which would briefly show the next card's back.
  const [turnNumber, setTurnNumber] = useState(0);

  const isFinished = progress.queue.length === 0;
  const currentCard = isFinished ? null : cards[progress.queue[0]];
  const progressPercent = Math.round((progress.learnedCount / totalCards) * 100);

  // Save progress every time it changes.
  useEffect(() => {
    saveProgress(saveKey, totalCards, progress);
  }, [saveKey, totalCards, progress]);

  /** Flip the current card to its other side. */
  function flipCard() {
    setShowingBack(!showingBack);
  }

  /** Move on to the next card, showing its front first. */
  function goToNextTurn() {
    setShowingBack(false);
    setTurnNumber(turnNumber + 1);
  }

  /** The cadet knew the card: remove it from the queue. */
  function markGotIt() {
    setProgress({
      queue: progress.queue.slice(1), // everything except the first card
      learnedCount: progress.learnedCount + 1,
      missCount: progress.missCount,
    });
    goToNextTurn();
  }

  /** The cadet didn't know the card: move it to the back of the queue. */
  function markStillLearning() {
    const restOfQueue = progress.queue.slice(1);
    setProgress({
      queue: [...restOfQueue, progress.queue[0]],
      learnedCount: progress.learnedCount,
      missCount: progress.missCount + 1,
    });
    goToNextTurn();
  }

  /** Start Learn over with all the cards in a new random order. */
  function restart() {
    setProgress(makeFreshProgress(totalCards));
    goToNextTurn();
  }

  // Keyboard shortcuts (see the note at the top of the file).
  useEffect(() => {
    /**
     * Run the matching action for a key press.
     * @param {KeyboardEvent} event - The key press.
     */
    function handleKeyDown(event) {
      if (shouldIgnoreKey(event) || isFinished) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault(); // stop Space from scrolling the page
        flipCard();
      } else if (event.key === "1" && showingBack) {
        markStillLearning();
      } else if (event.key === "2" && showingBack) {
        markGotIt();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // The progress bar and counter are shown both while learning and when done.
  const progressBar = (
    <div className="learn-progress">
      <div
        className="learn-progress-bar"
        role="progressbar"
        aria-label="Cards learned"
        aria-valuemin={0}
        aria-valuemax={totalCards}
        aria-valuenow={progress.learnedCount}
      >
        <div className="learn-progress-fill" style={{ width: progressPercent + "%" }} />
      </div>
      <span className="small muted">
        {progress.learnedCount} / {totalCards} learned
      </span>
    </div>
  );

  // Every card is learned: show a finish screen.
  if (isFinished) {
    return (
      <section className="flashcards">
        {progressBar}
        <div className="card learn-done">
          <h2>Nice work! 🎉</h2>
          <p>You learned all {totalCards} cards.</p>
          <p className="muted small">
            {progress.missCount === 0
              ? "You knew every card the first time."
              : "You marked \"Still learning\" " + progress.missCount + " time(s) along the way."}
          </p>
          <button className="button" onClick={restart}>
            Learn again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flashcards">
      {progressBar}

      {/* The same flip card as Flashcards mode. */}
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

      {/* Only let the cadet grade themselves after they've checked the answer. */}
      {showingBack ? (
        <div className="flashcard-controls">
          <button className="button secondary" onClick={markStillLearning}>
            Still learning <span className="key-hint">1</span>
          </button>
          <button className="button" onClick={markGotIt}>
            Got it <span className="key-hint">2</span>
          </button>
        </div>
      ) : (
        <p className="muted small center-text">
          Think of the answer, then click the card or press Space to check.
        </p>
      )}

      <div className="center-text">
        <button className="text-button small" onClick={restart}>
          Start over
        </button>
      </div>
    </section>
  );
}

export default Learn;
