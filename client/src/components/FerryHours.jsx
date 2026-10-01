/**
 * FerryHours.jsx
 *
 * Shows the ferry schedule. The data comes from GET /api/ferry.
 */

import { useEffect, useState } from "react";

/**
 * FerryHours - shows each day/departure point with its list of times.
 * @returns The ferry hours card.
 */
function FerryHours() {
  // The ferry data. It is null until the server responds.
  const [ferry, setFerry] = useState(null);

  // Ask the server for the ferry schedule once, when the component first appears.
  useEffect(() => {
    fetch("/api/ferry")
      .then((response) => response.json())
      .then((data) => setFerry(data))
      .catch((error) => console.error("Could not load ferry hours:", error));
  }, []);

  // Show a loading message until the data arrives.
  if (ferry === null) {
    return (
      <section className="card">
        <p className="card-label">Ferry Hours</p>
        <p className="muted">Loading...</p>
      </section>
    );
  }

  return (
    <section className="card">
      <p className="card-label">Ferry Hours</p>
      {ferry.schedule.map((row) => (
        <div key={row.day + row.departs} className="ferry-row">
          <p className="ferry-heading">
            From {row.departs} <span className="muted">· {row.day}</span>
          </p>
          {/* Each departure time is shown as a small rounded "chip". */}
          <div className="chips">
            {row.times.map((time) => (
              <span key={time} className="chip">
                {time}
              </span>
            ))}
          </div>
        </div>
      ))}
      <p className="muted small">{ferry.note}</p>
    </section>
  );
}

export default FerryHours;
