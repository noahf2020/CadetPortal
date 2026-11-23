/**
 * UniformOfTheDay.jsx
 *
 * Shows the current Uniform of the Day (UOD). The data comes from GET /api/uod.
 * The UOD is updated by hand (see "Updating the Uniform of the Day" in the README),
 * so the card shows when it was last updated and warns if that wasn't today.
 */

import { useEffect, useState } from "react";
import { fetchJson } from "../api.js";

/**
 * getTodayText - today's date on this computer, as text like "2026-11-23".
 * This is the same format the server uses, so the two can be compared.
 * @returns {string} Today's date.
 */
function getTodayText() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // getMonth() counts from 0
  const day = String(today.getDate()).padStart(2, "0");
  return today.getFullYear() + "-" + month + "-" + day;
}

/**
 * formatDate - turns "2026-11-23" into a friendlier "Mon, Nov 23, 2026".
 * @param {string} dateText - A date like "2026-11-23".
 * @returns {string} The readable date, or "unknown" if there is no date.
 */
function formatDate(dateText) {
  if (!dateText) {
    return "unknown";
  }
  const parts = dateText.split("-");
  // new Date(year, monthIndex, day) uses local time, so the day doesn't shift.
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/**
 * UniformOfTheDay - shows the uniform, when it was last updated, and any notes.
 * @returns The UOD card.
 */
function UniformOfTheDay() {
  // The UOD data. It is null until the server responds.
  const [uod, setUod] = useState(null);
  // A message to show if the UOD could not be loaded.
  const [errorMessage, setErrorMessage] = useState("");

  // Ask the server for the UOD once, when the component first appears.
  useEffect(() => {
    fetchJson("/api/uod")
      .then((data) => setUod(data))
      .catch((error) => setErrorMessage("Couldn't load the Uniform of the Day. " + error.message));
  }, []);

  if (uod === null) {
    return (
      <section className="card">
        <p className="card-label">Uniform of the Day</p>
        {errorMessage !== "" ? (
          <p className="error-message" role="alert">{errorMessage}</p>
        ) : (
          <p className="muted">Loading...</p>
        )}
      </section>
    );
  }

  // The UOD is "out of date" if it wasn't updated today.
  const isOutOfDate = uod.date !== getTodayText();

  return (
    <section className="card">
      <p className="card-label">Uniform of the Day</p>
      <p className="uod-uniform">{uod.uniform}</p>
      <p className="muted small">Last updated: {formatDate(uod.date)}</p>
      {isOutOfDate && (
        <p className="warning-message">
          This hasn't been updated today. Confirm the uniform with your chain of command.
        </p>
      )}
      {uod.notes && <p>{uod.notes}</p>}
    </section>
  );
}

export default UniformOfTheDay;
