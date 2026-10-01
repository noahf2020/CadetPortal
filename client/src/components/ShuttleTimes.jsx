/**
 * ShuttleTimes.jsx
 *
 * Shows the West Point shuttle schedule. The data comes from GET /api/shuttle.
 * Each route lists its stops and the minutes past the hour when the shuttle
 * arrives at each stop.
 */

import { useEffect, useState } from "react";

/**
 * ShuttleTimes - shows the Northbound and Southbound routes side by side.
 * @returns The shuttle times card.
 */
function ShuttleTimes() {
  // The shuttle data. It is null until the server responds.
  const [shuttle, setShuttle] = useState(null);

  // Ask the server for the shuttle schedule once, when the component first appears.
  useEffect(() => {
    fetch("/api/shuttle")
      .then((response) => response.json())
      .then((data) => setShuttle(data))
      .catch((error) => console.error("Could not load shuttle times:", error));
  }, []);

  // Show a loading message until the data arrives.
  if (shuttle === null) {
    return (
      <section className="card wide">
        <p className="card-label">Shuttle Times</p>
        <p className="muted">Loading...</p>
      </section>
    );
  }

  return (
    <section className="card wide">
      <p className="card-label">Shuttle Times</p>
      <p>{shuttle.hours}</p>

      {/* One column per route (Northbound and Southbound). */}
      <div className="shuttle-routes">
        {shuttle.routes.map((route) => (
          <div key={route.route}>
            <p className="schedule-heading">{route.route}</p>

            {/* One line per stop: the stop name, then its minutes past the hour. */}
            {route.stops.map((stop) => (
              <div key={stop.stop} className="shuttle-stop">
                <span>{stop.stop}</span>
                <span className="shuttle-minutes">
                  :{stop.minutes[0]} &nbsp; :{stop.minutes[1]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="muted small">{shuttle.note}</p>
    </section>
  );
}

export default ShuttleTimes;
