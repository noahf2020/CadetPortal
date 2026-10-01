/**
 * UniformOfTheDay.jsx
 *
 * Shows the current Uniform of the Day (UOD). The data comes from GET /api/uod.
 */

import { useEffect, useState } from "react";

/**
 * UniformOfTheDay - shows the uniform, its date, and any notes.
 * @returns The UOD section.
 */
function UniformOfTheDay() {
  // The UOD data. It is null until the server responds.
  const [uod, setUod] = useState(null);

  // Ask the server for the UOD once, when the component first appears.
  useEffect(() => {
    fetch("/api/uod")
      .then((response) => response.json())
      .then((data) => setUod(data))
      .catch((error) => console.error("Could not load UOD:", error));
  }, []);

  return (
    <section className="section">
      <h2>Uniform of the Day</h2>
      {/* Show "Loading..." until the data arrives, then show the UOD. */}
      {uod === null ? (
        <p>Loading...</p>
      ) : (
        <div>
          <p>
            <strong>{uod.uniform}</strong> ({uod.date})
          </p>
          <p>{uod.notes}</p>
        </div>
      )}
    </section>
  );
}

export default UniformOfTheDay;
