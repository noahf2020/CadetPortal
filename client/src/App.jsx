/**
 * App.jsx
 *
 * The main layout of the Cadet Portal. It shows a header and then
 * each section of the portal as its own component.
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
  return (
    <div className="page">
      <header className="header">
        <h1>Cadet Portal</h1>
        <p>Everything you need for cadet life, in one place.</p>
      </header>

      <main>
        <UniformOfTheDay />
        <QuickLinks />
        <FerryHours />
        <Announcements />
      </main>
    </div>
  );
}

export default App;
