/**
 * Carousel.jsx
 *
 * A "centered spotlight" carousel of link cards. It shows one large card
 * in the middle, with the previous and next cards peeking in on the sides.
 *
 * Cadets can move through the cards by:
 *   - clicking the arrow buttons or the dots
 *   - clicking a side card
 *   - swiping left/right on a phone
 * The cards also move forward by themselves every few seconds,
 * and pause while the mouse is over the carousel.
 *
 * Clicking the center card opens that service in a new tab.
 */

import { useEffect, useRef, useState } from "react";

// How long each card stays in the center before moving on (in milliseconds).
const AUTO_ROTATE_DELAY = 5000;

// How far a finger must move (in pixels) to count as a swipe.
const SWIPE_DISTANCE = 50;

/**
 * Carousel - shows a list of links as a rotating set of cards.
 * @param {Object} props
 * @param {Array} props.links - list of { name, description, url } objects.
 * @returns The carousel, or nothing if there are no links yet.
 */
function Carousel({ links }) {
  // Position (in the links list) of the card shown in the center.
  const [currentIndex, setCurrentIndex] = useState(0);

  // True while the mouse is over the carousel, so auto-rotate stops.
  const [isPaused, setIsPaused] = useState(false);

  // Where a finger first touched the screen (used to detect swipes).
  const touchStartX = useRef(0);

  /**
   * Turn any number into a valid position in the list, wrapping around
   * at both ends. For example, with 4 links: -1 becomes 3, and 4 becomes 0.
   * @param {number} index - a position that may be out of range.
   * @returns {number} a position from 0 to links.length - 1.
   */
  function wrapIndex(index) {
    return (index + links.length) % links.length;
  }

  /** Move to the next card (to the right). */
  function showNext() {
    setCurrentIndex((oldIndex) => wrapIndex(oldIndex + 1));
  }

  /** Move to the previous card (to the left). */
  function showPrevious() {
    setCurrentIndex((oldIndex) => wrapIndex(oldIndex - 1));
  }

  // Auto-rotate: move to the next card every few seconds.
  // The timer restarts whenever the card changes, so after a cadet clicks
  // an arrow they get the full delay before it moves again.
  useEffect(() => {
    // Don't rotate while paused, or if there is nothing to rotate to.
    if (isPaused || links.length < 2) {
      return;
    }

    const timer = setInterval(showNext, AUTO_ROTATE_DELAY);

    // Clean up: stop the old timer before starting a new one.
    return () => clearInterval(timer);
  }, [isPaused, links.length, currentIndex]);

  /** Remember where the finger touched down. */
  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX;
  }

  /** When the finger lifts, check if it moved far enough to be a swipe. */
  function handleTouchEnd(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX.current;

    if (distance > SWIPE_DISTANCE) {
      showPrevious(); // finger moved right
    } else if (distance < -SWIPE_DISTANCE) {
      showNext(); // finger moved left
    }
  }

  // Nothing to show until the links arrive from the server.
  if (links.length === 0) {
    return <p className="hero-subtitle">Loading...</p>;
  }

  // The three cards on screen: left, center, and right.
  const previousLink = links[wrapIndex(currentIndex - 1)];
  const currentLink = links[currentIndex];
  const nextLink = links[wrapIndex(currentIndex + 1)];

  // Only show side cards when there are at least 3 links,
  // otherwise the same card would appear twice.
  const showSideCards = links.length >= 3;

  return (
    <div
      className="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="carousel-track">
        <button className="carousel-arrow" onClick={showPrevious} aria-label="Previous card">
          ◀
        </button>

        {/* Left card: clicking it moves it to the center. */}
        {showSideCards && (
          <button className="carousel-card side" onClick={showPrevious}>
            <span className="carousel-category">{previousLink.category}</span>
            <strong>{previousLink.name}</strong>
          </button>
        )}

        {/* Center card: clicking it opens the service.
            "key" makes React redraw it when it changes, which replays the slide-in animation. */}
        <a
          key={currentLink.name}
          className="carousel-card center"
          href={currentLink.url}
          target="_blank"
          rel="noreferrer"
        >
          <span className="carousel-category">{currentLink.category}</span>
          <h3>{currentLink.name}</h3>
          <p>{currentLink.description}</p>
          <span className="carousel-open">Open →</span>
        </a>

        {/* Right card: clicking it moves it to the center. */}
        {showSideCards && (
          <button className="carousel-card side" onClick={showNext}>
            <span className="carousel-category">{nextLink.category}</span>
            <strong>{nextLink.name}</strong>
          </button>
        )}

        <button className="carousel-arrow" onClick={showNext} aria-label="Next card">
          ▶
        </button>
      </div>

      {/* One dot per card. The filled dot marks the center card. */}
      <div className="carousel-dots">
        {links.map((link, index) => (
          <button
            key={link.name}
            className={index === currentIndex ? "dot active" : "dot"}
            onClick={() => setCurrentIndex(index)}
            aria-label={"Show " + link.name}
          />
        ))}
      </div>
    </div>
  );
}

export default Carousel;
