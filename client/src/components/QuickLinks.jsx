/**
 * QuickLinks.jsx
 *
 * Shows a grid of links to common cadet services
 * (Regulation Wizard, Citemate, etc.). The links come from GET /api/links.
 */

import { useEffect, useState } from "react";

/**
 * QuickLinks - shows one card for each service link.
 * @returns The quick links section.
 */
function QuickLinks() {
  // The list of links. It starts empty until the server responds.
  const [links, setLinks] = useState([]);

  // Ask the server for the links once, when the component first appears.
  useEffect(() => {
    fetch("/api/links")
      .then((response) => response.json())
      .then((data) => setLinks(data))
      .catch((error) => console.error("Could not load links:", error));
  }, []);

  return (
    <section className="section">
      <h2>Quick Links</h2>
      <div className="link-grid">
        {links.map((link) => (
          // "key" helps React keep track of each card in the list.
          <a key={link.name} className="link-card" href={link.url} target="_blank" rel="noreferrer">
            <strong>{link.name}</strong>
            <p>{link.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

export default QuickLinks;
