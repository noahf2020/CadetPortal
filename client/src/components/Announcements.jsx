/**
 * Announcements.jsx
 *
 * Shows the list of announcements. The data comes from GET /api/announcements.
 */

import { useEffect, useState } from "react";

/**
 * Announcements - shows each announcement's title, author, date, and text.
 * @returns The announcements card (it stretches across the full grid width).
 */
function Announcements() {
  // The list of announcements. It starts empty until the server responds.
  const [announcements, setAnnouncements] = useState([]);

  // Ask the server for the announcements once, when the component first appears.
  useEffect(() => {
    fetch("/api/announcements")
      .then((response) => response.json())
      .then((data) => setAnnouncements(data))
      .catch((error) => console.error("Could not load announcements:", error));
  }, []);

  return (
    <section className="card wide">
      <p className="card-label">Announcements</p>
      {announcements.map((item) => (
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
