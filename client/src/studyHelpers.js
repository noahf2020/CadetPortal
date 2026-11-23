/**
 * studyHelpers.js
 *
 * Small helper functions shared by the study modes (Flashcards, Learn, Test)
 * and the deck page. None of these are React components.
 */

/**
 * shuffleList - makes a shuffled copy of a list.
 * It uses the Fisher-Yates method: go from the end of the list to the start,
 * and swap each item with a random item at or before it.
 * @param {Array} items - The items to shuffle (cards, numbers, anything).
 * @returns {Array} A new list with the same items in random order.
 */
export function shuffleList(items) {
  const shuffled = [...items]; // copy, so the original list is not changed
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temporary = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = temporary;
  }
  return shuffled;
}

/**
 * makeNumberList - makes the list [0, 1, 2, ..., count - 1].
 * Useful for keeping track of cards by their position in the deck.
 * @param {number} count - How many numbers to make.
 * @returns {Array} The list of numbers.
 */
export function makeNumberList(count) {
  const numbers = [];
  for (let i = 0; i < count; i++) {
    numbers.push(i);
  }
  return numbers;
}

/**
 * shouldIgnoreKey - decides if a keyboard shortcut should be skipped.
 * Shortcuts are skipped while the cadet is typing in a box. Space and Enter
 * are skipped on buttons, because the browser already "clicks" a button on
 * those keys (running the shortcut too would do the action twice).
 * @param {KeyboardEvent} event - The key press.
 * @returns {boolean} True if the shortcut should NOT run.
 */
export function shouldIgnoreKey(event) {
  const tagName = event.target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  if ((event.key === " " || event.key === "Enter") && tagName === "BUTTON") {
    return true;
  }
  // Leave Ctrl / Alt / Cmd shortcuts (like Ctrl+C) to the browser.
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return true;
  }
  return false;
}

/**
 * makeDeckText - turns a deck's cards into tab-separated text, one card per line.
 * This is the same format the deck editor can import.
 * Tabs and line breaks inside a card are changed to spaces so they don't
 * break the format.
 * @param {Array} cards - The cards, each { term, definition }.
 * @returns {string} The text to save in a .txt file.
 */
export function makeDeckText(cards) {
  const lines = [];
  for (const card of cards) {
    const term = card.term.replace(/[\t\r\n]+/g, " ");
    const definition = card.definition.replace(/[\t\r\n]+/g, " ");
    lines.push(term + "\t" + definition);
  }
  return lines.join("\n") + "\n";
}

/**
 * downloadTextFile - makes the browser download some text as a file.
 * @param {string} fileName - The name for the file, e.g. "Military Ranks.txt".
 * @param {string} text - What to put inside the file.
 */
export function downloadTextFile(fileName, text) {
  // A Blob is file data that lives in the browser's memory.
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  // Make a hidden link to the file and "click" it to start the download.
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  // Free the memory now that the download has started.
  URL.revokeObjectURL(url);
}
