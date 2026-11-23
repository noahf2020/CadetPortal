/**
 * QuickLinks.jsx
 *
 * The "hero" area at the top of the page. It shows links to common cadet
 * services (Regulation Wizard, Citemate, etc.) as a carousel of cards.
 * The links come from GET /api/links.
 */

import { useEffect, useState } from "react";
import Carousel from "./Carousel.jsx";
import { fetchJson } from "../api.js";

/**
 * QuickLinks - loads the service links and hands them to the Carousel.
 * @returns The hero section with the carousel.
 */
function QuickLinks() {
  // The list of links. It starts empty until the server responds.
  const [links, setLinks] = useState([]);
  // A message to show if the links could not be loaded.
  const [errorMessage, setErrorMessage] = useState("");

  // Ask the server for the links once, when the component first appears.
  useEffect(() => {
    fetchJson("/api/links")
      .then((data) => setLinks(data))
      .catch((error) => setErrorMessage("Couldn't load quick links. " + error.message));
  }, []);

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>Everything you need, in one place.</h1>
        <p className="hero-subtitle">Quick access to the services cadets use every day.</p>
        {/* Show the error instead of the carousel (which would say "Loading..." forever). */}
        {errorMessage !== "" ? (
          <p className="hero-error" role="alert">{errorMessage}</p>
        ) : (
          <Carousel links={links} />
        )}
      </div>
    </section>
  );
}

export default QuickLinks;
