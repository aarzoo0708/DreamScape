import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";

function MemoryForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.form
        className="memory-form"
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="eyebrow">SAVE THIS MOMENT</div>
        <h2>A memory to keep.</h2>
        <p className="form-intro">Give this little moment a name.</p>

        <label htmlFor="memory-title">Memory title</label>
        <input
          id="memory-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="That beautiful Sunday..."
          required
        />

        <label htmlFor="memory-description">A few words about it</label>
        <textarea
          id="memory-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="What made this moment special?"
          rows="3"
        />

        <button type="submit" className="primary-button submit-button">
          Save memory <Heart size={16} />
        </button>

        <p className="form-footnote">
          This demo saves memories only in the current page session.
        </p>
      </motion.form>
    </div>
  );
}

export default MemoryForm;
