import { Heart, Sparkles } from "lucide-react";

function ClosingSection({ onAddMemory }) {
  return (
    <section className="closing-section" id="about">
      <div className="closing-sparkle"><Sparkles size={34} /></div>
      <div className="eyebrow">A GENTLE REMINDER</div>
      <h2>
        Life happens
        <br />
        <span className="gradient-text">in the little things.</span>
      </h2>
      <p>
        Take the pictures. Keep the letters. Remember how it felt. One day,
        these ordinary moments will be your extraordinary memories.
      </p>
      <button type="button" className="primary-button" onClick={onAddMemory}>
        Save a little moment <Heart size={16} />
      </button>
    </section>
  );
}

export default ClosingSection;
