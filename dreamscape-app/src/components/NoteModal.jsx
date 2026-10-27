import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";

function NoteModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="note-modal"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close note">
          <X size={20} />
        </button>
        <span className="modal-sparkle">âœ¦</span>
        <div className="eyebrow">A NOTE TO YOUR HEART</div>
        <h2>Hey, you.</h2>
        <p>
          Just a little reminder that you don't have to make every day
          extraordinary. Sometimes, being here, laughing with someone you
          love, or watching the sunset is more than enough.
        </p>
        <p className="note-signoff">Keep the little things close. â™¡</p>
        <button className="primary-button" onClick={onClose}>
          Keep this feeling <Heart size={16} />
        </button>
      </motion.div>
    </div>
  );
}

export default NoteModal;
