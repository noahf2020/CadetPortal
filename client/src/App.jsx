/**
 * App.jsx
 *
 * The main layout of the Cadet Portal:
 *   1. A top bar with the portal name and today's date.
 *   2. A dark "hero" area with the Quick Links carousel.
 *   3. A grid of info cards (UOD, ferry hours, announcements).
 */

import UniformOfTheDay from "./components/UniformOfTheDay.jsx";
import QuickLinks from "./components/QuickLinks.jsx";
import FerryHours from "./components/FerryHours.jsx";
import Announcements from "./components/Announcements.jsx";

/**
 * App - the top-level component of the portal.
 * @returns The full portal page.
 */
function App() {
  // Today's date written out, e.g. "Thursday, October 1".
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            {/* Small gold square with the portal's initials. */}
            <span className="brand-mark">CP</span>
            <span className="brand-name">Cadet Portal</span>
          </div>
          <span className="topbar-date">{today}</span>
        </div>
      </header>

      <QuickLinks />

      <main className="page">
        <div className="info-grid">
          <UniformOfTheDay />
          <FerryHours />
          <Announcements />
        </div>
      </main>
    </div>
  );
}

export default App;
