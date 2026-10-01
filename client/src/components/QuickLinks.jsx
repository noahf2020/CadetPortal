/**
 * QuickLinks.jsx
 *
 * The "hero" area at the top of the page. It shows links to common cadet
 * services (Regulation Wizard, Citemate, etc.) as a carousel of cards.
 * The links come from GET /api/links.
 */

import { useEffect, useState } from "react";
import Carousel from "./Carousel.jsx";

/**
 * QuickLinks - loads the service links and hands them to the Carousel.
 * @returns The hero section with the carousel.
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
    <section className="hero">
      <div className="hero-inner">
        <h1>Everything you need, in one place.</h1>
        <p className="hero-subtitle">Quick access to the services cadets use every day.</p>
        <Carousel links={links} />
      </div>
    </section>
  );
}

export default QuickLinks;
