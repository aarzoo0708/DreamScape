import { motion } from "framer-motion";
import { Heart } from "lucide-react";

function MemoryCard({ memory, index, liked, onLike }) {
  return (
    <motion.article
      className="memory-card"
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.12 }}
    >
      <div
        className="memory-image-wrap"
        style={{ "--card-rotation": memory.rotate }}
      >
        <img src={memory.image} alt={memory.title} />
        <span className="memory-tag">{memory.tag}</span>
        <button
          className={`like-button ${liked ? "is-liked" : ""}`}
          onClick={onLike}
          type="button"
          aria-label={liked ? `Unlike ${memory.title}` : `Like ${memory.title}`}
          aria-pressed={liked}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="memory-info">
        <span className="memory-date">{memory.date}</span>
        <h3>{memory.title}</h3>
        <p>{memory.description}</p>
      </div>
    </motion.article>
  );
}

export default MemoryCard;
