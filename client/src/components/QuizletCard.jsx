/**
 * QuizletCard.jsx
 *
 * A card on the home page that sends cadets to the study decks (/quizlet).
 */

import { Link } from "react-router";

/**
 * QuizletCard - a short description of the study decks and a button to open them.
 * @returns The study decks card (it stretches across the full grid width).
 */
function QuizletCard() {
  return (
    <section className="card wide quizlet-card">
      <div>
        <p className="card-label">Cadet Quizlet</p>
        <p className="uod-uniform">Study Decks</p>
        <p className="muted">
          Flashcards made by cadets. Find decks for your class or your instructor.
        </p>
      </div>
      <Link to="/quizlet" className="button">
        Start studying →
      </Link>
    </section>
  );
}

export default QuizletCard;
