/**
 * FerryHours.jsx
 *
 * Shows the ferry schedule as a table. The data comes from GET /api/ferry.
 */

import { useEffect, useState } from "react";

/**
 * FerryHours - shows one table row for each day/departure point.
 * @returns The ferry hours section.
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
      <section className="section">
        <h2>Ferry Hours</h2>
        <p>Loading...</p>
      </section>
    );
  }

  return (
    <section className="section">
      <h2>Ferry Hours</h2>
      <p>{ferry.note}</p>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Departs</th>
            <th>Times</th>
          </tr>
        </thead>
        <tbody>
          {ferry.schedule.map((row) => (
            <tr key={row.day + row.departs}>
              <td>{row.day}</td>
              <td>{row.departs}</td>
              {/* Join the list of times into one string, e.g. "07:00, 08:00" */}
              <td>{row.times.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default FerryHours;
