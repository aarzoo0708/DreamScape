import { motion as Motion } from "framer-motion";
import { Heart, Sparkles, X } from "lucide-react";

function NoteModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Motion.div
        className="note-modal"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close note">
          <X size={20} />
        </button>
        <span className="modal-sparkle"><Sparkles size={34} /></span>
        <div className="eyebrow">A NOTE TO YOUR HEART</div>
        <h2>Hey, you.</h2>
        <p>
          Just a little reminder that you don't have to make every day
          extraordinary. Sometimes, being here, laughing with someone you
          love, or watching the sunset is more than enough.
        </p>
        <p className="note-signoff">Keep the little things close. <Heart size={15} /></p>
        <button className="primary-button" onClick={onClose}>
          Keep this feeling <Heart size={16} />
        </button>
      </Motion.div>
    </div>
  );
}

export default NoteModal;
