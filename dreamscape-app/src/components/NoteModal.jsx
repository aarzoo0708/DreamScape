import { useEffect, useRef } from "react";
import { motion as Motion } from "framer-motion";
import { Heart, Sparkles, X } from "lucide-react";
import { trapModalTab } from "../utils/trapModalTab";

function NoteModal({ onClose }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      trapModalTab(event, dialogRef.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Motion.div
        ref={dialogRef}
        className="note-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-modal-title"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className="modal-close" onClick={onClose} aria-label="Close note">
          <X size={20} />
        </button>
        <span className="modal-sparkle"><Sparkles size={34} /></span>
        <div className="eyebrow">A NOTE TO YOUR HEART</div>
        <h2 id="note-modal-title">Hey, you.</h2>
        <p>
          Just a little reminder that you don't have to make every day
          extraordinary. Sometimes, being here, laughing with someone you
          love, or watching the sunset is more than enough.
        </p>
        <p className="note-signoff">Keep the little things close. <Heart size={15} /></p>
        <button type="button" className="primary-button" onClick={onClose}>
          Keep this feeling <Heart size={16} />
        </button>
      </Motion.div>
    </div>
  );
}

export default NoteModal;
