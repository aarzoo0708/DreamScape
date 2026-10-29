
import { Plus, Sparkles } from "lucide-react";

function Navbar({ activeView, showFavourites, onAddMemory, onShowMemories, onNavigate }) {
  return (
    <nav className="navbar cinematic-navbar">
      <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); onNavigate("home"); }}>
        <span className="brand-icon">
          <Sparkles size={19} />
        </span>

        dreamscape<span className="brand-dot">.</span>
      </a>

      <div className="nav-links">
        <a href="#memories" className={activeView === "home" && !showFavourites ? "is-active" : ""} aria-current={activeView === "home" && !showFavourites ? "page" : undefined} onClick={(event) => { event.preventDefault(); onShowMemories(); }}>Our memories</a>
        <a href="#timeline" className={activeView === "timeline" ? "is-active" : ""} aria-current={activeView === "timeline" ? "page" : undefined} onClick={(event) => { event.preventDefault(); onNavigate("timeline"); }}>Timeline</a>
        <a href="#calendar" className={activeView === "calendar" ? "is-active" : ""} aria-current={activeView === "calendar" ? "page" : undefined} onClick={(event) => { event.preventDefault(); onNavigate("calendar"); }}>Calendar</a>
        <a href="#journal" className={activeView === "journal" ? "is-active" : ""} aria-current={activeView === "journal" ? "page" : undefined} onClick={(event) => { event.preventDefault(); onNavigate("journal"); }}>Journal</a>
      </div>

      <button
        type="button"
        className="nav-button"
        onClick={onAddMemory}
      >
        <Plus size={16} />
        Add memory
      </button>
    </nav>
  );
}

export default Navbar;
