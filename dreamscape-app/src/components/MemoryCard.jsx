import { useRef } from "react";
import {
  motion as Motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Heart } from "lucide-react";

function MemoryCard({ memory, index, liked, onLike }) {
  const cardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const cardY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -18]);
  const cardTilt = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 0, -1.2]);

  return (
    <Motion.article
      ref={cardRef}
      className="memory-card"
      style={reducedMotion ? undefined : { y: cardY, rotateX: cardTilt }}
      initial={reducedMotion ? false : { opacity: 0 }}
      whileInView={reducedMotion ? undefined : { opacity: 1 }}
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
    </Motion.article>
  );
}

export default MemoryCard;
