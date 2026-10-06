/**
 * HomePage.jsx
 *
 * The portal's home page (URL "/"): the Quick Links carousel, then a grid
 * of info cards (UOD, ferry hours, shuttle times, study decks, announcements).
 */

import UniformOfTheDay from "./UniformOfTheDay.jsx";
import QuickLinks from "./QuickLinks.jsx";
import FerryHours from "./FerryHours.jsx";
import ShuttleTimes from "./ShuttleTimes.jsx";
import QuizletCard from "./QuizletCard.jsx";
import Announcements from "./Announcements.jsx";

/**
 * HomePage - puts all of the home page sections together.
 * @returns The full home page.
 */
function HomePage() {
  return (
    <div>
      <QuickLinks />

      <main className="page">
        <div className="info-grid">
          <UniformOfTheDay />
          <FerryHours />
          <ShuttleTimes />
          <QuizletCard />
          <Announcements />
        </div>
      </main>
    </div>
  );
}

export default HomePage;
