/**
 * Announcements.jsx
 *
 * Shows the list of announcements. The data comes from GET /api/announcements.
 */

import { useEffect, useState } from "react";

/**
 * Announcements - shows each announcement's title, author, date, and text.
 * @returns The announcements section.
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
    <section className="section">
      <h2>Announcements</h2>
      {announcements.map((item) => (
        <article key={item.id}>
          <h3>{item.title}</h3>
          <small>
            {item.author} - {item.date}
          </small>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}

export default Announcements;
