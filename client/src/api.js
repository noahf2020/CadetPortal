/**
 * api.js
 *
 * One helper for talking to the Flask server: fetchJson.
 * Every component uses it instead of calling fetch() directly, so every
 * failure turns into a clear message the cadet can see (instead of the page
 * getting stuck on "Loading..." or a button that silently does nothing).
 */

/**
 * fetchJson - calls the server and returns the JSON it sends back.
 *
 * It throws an Error (which the caller catches with .catch) when:
 *   - the server can't be reached (no internet, server down),
 *   - the server sends back something that isn't JSON (e.g. a crash page),
 *   - the server says something went wrong (status 400, 403, 404, 500, ...).
 *     Our Flask routes send { "error": "..." } in that case, and that
 *     message becomes the Error's message, e.g. "Wrong edit code."
 *
 * @param {string} url - The API address, e.g. "/api/decks/3".
 * @param {Object} [options] - Optional fetch settings (method, headers, body).
 * @returns {Promise} The data from the server, e.g. a list of decks.
 */
export async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error("Couldn't reach the server. Check your internet connection and try again.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server sent back an unexpected reply. Try again in a minute.");
  }

  // response.ok is true for statuses 200-299 (success).
  if (!response.ok) {
    if (data && data.error) {
      throw new Error(data.error);
    }
    throw new Error("Something went wrong on the server. Try again in a minute.");
  }

  return data;
}
