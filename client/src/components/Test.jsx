/**
 * Test.jsx
 *
 * The Test study mode: a multiple-choice quiz with a score at the end.
 *   1. Setup:    the cadet picks how many questions to answer.
 *   2. Question: shows the front of a card and up to 4 possible answers.
 *                After picking, the right answer turns green (and a wrong pick red).
 *   3. Results:  the score, plus a list of every question that was missed.
 *
 * Keyboard: 1-4 pick an answer, Enter goes to the next question.
 */

import { useEffect, useState } from "react";
import { makeNumberList, shouldIgnoreKey, shuffleList } from "../studyHelpers.js";

// The most answer choices shown for one question.
const MAX_CHOICES = 4;
// The question counts a cadet can pick from (only ones that fit the deck are shown).
const QUESTION_COUNT_OPTIONS = [5, 10, 20];

/**
 * getUniqueBacks - lists every different "back" in the deck, with no repeats.
 * Wrong answers are picked from this list.
 * @param {Array} cards - The cards, each { front, back }.
 * @returns {Array} The different back texts.
 */
function getUniqueBacks(cards) {
  const uniqueBacks = [];
  for (const card of cards) {
    if (!uniqueBacks.includes(card.back)) {
      uniqueBacks.push(card.back);
    }
  }
  return uniqueBacks;
}

/**
 * makeQuestion - builds one multiple-choice question from a card.
 * @param {Object} card - The card to ask about, { front, back }.
 * @param {Array} uniqueBacks - Every different back in the deck.
 * @returns {Object} { prompt, correctAnswer, choices } where choices is a
 *   shuffled list that includes the correct answer.
 */
function makeQuestion(card, uniqueBacks) {
  // Every back except this card's own answer can be a wrong choice.
  const wrongAnswers = [];
  for (const back of uniqueBacks) {
    if (back !== card.back) {
      wrongAnswers.push(back);
    }
  }

  const pickedWrongAnswers = shuffleList(wrongAnswers).slice(0, MAX_CHOICES - 1);
  return {
    prompt: card.front,
    correctAnswer: card.back,
    choices: shuffleList([card.back, ...pickedWrongAnswers]),
  };
}

/**
 * makeTest - builds a list of questions from random cards in the deck.
 * @param {Array} cards - The cards, each { front, back }.
 * @param {number} questionCount - How many questions to make.
 * @returns {Array} The questions (see makeQuestion).
 */
function makeTest(cards, questionCount) {
  const uniqueBacks = getUniqueBacks(cards);
  const pickedCardNumbers = shuffleList(makeNumberList(cards.length)).slice(0, questionCount);

  const questions = [];
  for (const cardNumber of pickedCardNumbers) {
    questions.push(makeQuestion(cards[cardNumber], uniqueBacks));
  }
  return questions;
}

/**
 * Test - a multiple-choice quiz with a score at the end.
 * @param {Object} props
 * @param {Array} props.cards - The cards, each { front, back }.
 * @param {string} props.frontLabel - What the question shows, e.g. "Term".
 * @param {string} props.backLabel - What the answers are, e.g. "Definition".
 * @returns The setup screen, a question, or the results.
 */
function Test({ cards, frontLabel, backLabel }) {
  // Which screen is showing: "setup", "question", or "results".
  const [screen, setScreen] = useState("setup");
  // How many questions the cadet picked. Starts at 10, or fewer for small decks.
  const [questionCount, setQuestionCount] = useState(Math.min(10, cards.length));
  // The questions for this test.
  const [questions, setQuestions] = useState([]);
  // Which question is showing, starting at 0.
  const [questionNumber, setQuestionNumber] = useState(0);
  // The answer the cadet picked for the current question (null until they pick).
  const [chosenAnswer, setChosenAnswer] = useState(null);
  // Every answer so far, each { prompt, chosenAnswer, correctAnswer }.
  const [answers, setAnswers] = useState([]);

  // A test needs at least two different answers, or there is nothing to choose between.
  const hasEnoughCards = getUniqueBacks(cards).length >= 2;

  /** Build a new set of questions and show the first one. */
  function startTest() {
    setQuestions(makeTest(cards, questionCount));
    setQuestionNumber(0);
    setChosenAnswer(null);
    setAnswers([]);
    setScreen("question");
  }

  /**
   * Record the cadet's answer to the current question.
   * @param {string} answer - The choice they picked.
   */
  function chooseAnswer(answer) {
    if (chosenAnswer !== null) {
      return; // already answered this question
    }
    const question = questions[questionNumber];
    setChosenAnswer(answer);
    setAnswers([
      ...answers,
      { prompt: question.prompt, chosenAnswer: answer, correctAnswer: question.correctAnswer },
    ]);
  }

  /** Go to the next question, or to the results after the last one. */
  function goToNextQuestion() {
    if (chosenAnswer === null) {
      return; // must answer first
    }
    if (questionNumber === questions.length - 1) {
      setScreen("results");
    } else {
      setQuestionNumber(questionNumber + 1);
      setChosenAnswer(null);
    }
  }

  // Keyboard shortcuts (see the note at the top of the file).
  useEffect(() => {
    /**
     * Run the matching action for a key press.
     * @param {KeyboardEvent} event - The key press.
     */
    function handleKeyDown(event) {
      if (shouldIgnoreKey(event) || screen !== "question") {
        return;
      }
      const choices = questions[questionNumber].choices;
      // "1" picks the first choice, "2" the second, and so on.
      const choiceIndex = Number(event.key) - 1;
      if (choiceIndex >= 0 && choiceIndex < choices.length) {
        chooseAnswer(choices[choiceIndex]);
      } else if (event.key === "Enter") {
        goToNextQuestion();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (!hasEnoughCards) {
    return (
      <section className="card test-box">
        <p className="muted">Test mode needs at least 2 cards with different answers.</p>
      </section>
    );
  }

  if (screen === "setup") {
    return (
      <TestSetup
        totalCards={cards.length}
        questionCount={questionCount}
        setQuestionCount={setQuestionCount}
        onStart={startTest}
      />
    );
  }

  if (screen === "results") {
    return <TestResults answers={answers} onRetake={startTest} onNewTest={() => setScreen("setup")} />;
  }

  // screen === "question"
  const question = questions[questionNumber];
  const isLastQuestion = questionNumber === questions.length - 1;

  return (
    <section className="card test-box">
      <p className="card-label">
        Question {questionNumber + 1} of {questions.length}
      </p>
      <p className="muted small">{frontLabel}</p>
      <h2 className="test-prompt">{question.prompt}</h2>
      <p className="muted small">Pick the matching {backLabel.toLowerCase()}:</p>

      <div className="test-choices">
        {question.choices.map((choice, index) => (
          <button
            key={choice}
            className={getChoiceClass(choice, chosenAnswer, question.correctAnswer)}
            onClick={() => chooseAnswer(choice)}
            disabled={chosenAnswer !== null}
          >
            <span className="key-hint">{index + 1}</span>
            {choice}
          </button>
        ))}
      </div>

      {chosenAnswer !== null && (
        <div className="test-feedback">
          {/* aria-live makes screen readers announce the result. */}
          <p aria-live="polite">
            {chosenAnswer === question.correctAnswer ? "✅ Correct!" : "❌ Not quite."}
          </p>
          <button className="button" onClick={goToNextQuestion}>
            {isLastQuestion ? "See results" : "Next"} <span className="key-hint">Enter</span>
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * getChoiceClass - picks the CSS class for an answer button, so it can turn
 * green (correct answer) or red (the wrong answer the cadet picked).
 * @param {string} choice - The answer on this button.
 * @param {string|null} chosenAnswer - What the cadet picked, or null if nothing yet.
 * @param {string} correctAnswer - The right answer.
 * @returns {string} The class names for the button.
 */
function getChoiceClass(choice, chosenAnswer, correctAnswer) {
  if (chosenAnswer === null) {
    return "test-choice";
  }
  if (choice === correctAnswer) {
    return "test-choice correct";
  }
  if (choice === chosenAnswer) {
    return "test-choice wrong";
  }
  return "test-choice";
}

/**
 * TestSetup - the screen where the cadet picks how many questions to answer.
 * @param {Object} props
 * @param {number} props.totalCards - How many cards are in the deck.
 * @param {number} props.questionCount - The number picked right now.
 * @param {Function} props.setQuestionCount - Changes the number picked.
 * @param {Function} props.onStart - Starts the test.
 * @returns The setup screen.
 */
function TestSetup({ totalCards, questionCount, setQuestionCount, onStart }) {
  // Only offer counts smaller than the deck, plus "All".
  const countOptions = [];
  for (const count of QUESTION_COUNT_OPTIONS) {
    if (count < totalCards) {
      countOptions.push(count);
    }
  }

  return (
    <section className="card test-box">
      <h2>Test yourself</h2>
      <p className="muted">Multiple choice. You'll see your score at the end.</p>
      <label className="test-setup-label">
        Number of questions
        <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
          {countOptions.map((count) => (
            <option key={count} value={count}>{count}</option>
          ))}
          <option value={totalCards}>All ({totalCards})</option>
        </select>
      </label>
      <button className="button" onClick={onStart}>
        Start test
      </button>
    </section>
  );
}

/**
 * TestResults - the score and a list of missed questions.
 * @param {Object} props
 * @param {Array} props.answers - Every answer, each { prompt, chosenAnswer, correctAnswer }.
 * @param {Function} props.onRetake - Starts a new test with the same settings.
 * @param {Function} props.onNewTest - Goes back to the setup screen.
 * @returns The results screen.
 */
function TestResults({ answers, onRetake, onNewTest }) {
  const missedAnswers = [];
  for (const answer of answers) {
    if (answer.chosenAnswer !== answer.correctAnswer) {
      missedAnswers.push(answer);
    }
  }
  const correctCount = answers.length - missedAnswers.length;
  const percent = Math.round((correctCount / answers.length) * 100);

  return (
    <section className="card test-box">
      <p className="card-label">Results</p>
      <h2 className="test-score">
        {correctCount} / {answers.length} <span className="muted">({percent}%)</span>
      </h2>
      <p>{getScoreMessage(percent)}</p>

      {missedAnswers.length > 0 && (
        <div className="test-missed">
          <p className="card-label">Missed ({missedAnswers.length})</p>
          {missedAnswers.map((answer, index) => (
            <div key={index} className="test-missed-row">
              <span className="term-word">{answer.prompt}</span>
              <span>
                <span className="test-wrong-text">Your answer: {answer.chosenAnswer}</span>
                <br />
                <span className="test-right-text">Correct: {answer.correctAnswer}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="form-buttons">
        <button className="button" onClick={onRetake}>
          Retake test
        </button>
        <button className="button secondary" onClick={onNewTest}>
          Change settings
        </button>
      </div>
    </section>
  );
}

/**
 * getScoreMessage - a short message to show with the score.
 * @param {number} percent - The score from 0 to 100.
 * @returns {string} The message.
 */
function getScoreMessage(percent) {
  if (percent === 100) {
    return "Perfect score! 🎉";
  }
  if (percent >= 70) {
    return "Good job. Review the ones you missed below.";
  }
  return "Keep studying. Try Learn mode on the ones you missed.";
}

export default Test;
