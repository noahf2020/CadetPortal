/**
 * Announcements.jsx
 *
 * Shows the list of announcements. The data comes from GET /api/announcements.
 */

import { useEffect, useState } from "react";
import { fetchJson } from "../api.js";

/**
 * Announcements - shows each announcement's title, author, date, and text.
 * @returns The announcements card (it stretches across the full grid width).
 */
function Announcements() {
  // The list of announcements. It is null until the server responds.
  const [announcements, setAnnouncements] = useState(null);
  // A message to show if the announcements could not be loaded.
  const [errorMessage, setErrorMessage] = useState("");

  // Ask the server for the announcements once, when the component first appears.
  useEffect(() => {
    fetchJson("/api/announcements")
      .then((data) => setAnnouncements(data))
      .catch((error) => setErrorMessage("Couldn't load announcements. " + error.message));
  }, []);

  return (
    <section className="card wide">
      <p className="card-label">Announcements</p>
      {errorMessage !== "" && <p className="error-message" role="alert">{errorMessage}</p>}
      {errorMessage === "" && announcements === null && <p className="muted">Loading...</p>}
      {announcements !== null && announcements.length === 0 && <p className="muted">No announcements right now.</p>}
      {announcements !== null &&
        announcements.map((item) => (
          <article key={item.id} className="announcement">
            <h3>{item.title}</h3>
            <p className="muted small">
              {item.author} · {item.date}
            </p>
            <p>{item.body}</p>
          </article>
        ))}
    </section>
  );
}

export default Announcements;
