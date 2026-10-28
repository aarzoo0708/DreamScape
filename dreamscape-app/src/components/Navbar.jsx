
import { Plus, Sparkles } from "lucide-react";

function Navbar({ onAddMemory, onShowFavourites }) {
  return (
    <nav className="navbar cinematic-navbar">
      <a className="brand" href="#home">
        <span className="brand-icon">
          <Sparkles size={19} />
        </span>

        dreamscape<span className="brand-dot">.</span>
      </a>

      <div className="nav-links">
        <a href="#memories">Our memories</a>
        <a href="#memories" onClick={onShowFavourites}>Favourites</a>
        <a href="#about">The little things</a>
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
