import { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import "./IntroExperience.css";

const particles = [
  [8, 22], [17, 68], [24, 35], [31, 82], [42, 18], [57, 74],
  [67, 27], [76, 61], [84, 19], [92, 43], [13, 48], [89, 79],
];

function IntroExperience({ memories, onReveal, onComplete }) {
  const reducedMotion = useReducedMotion();
  const [entering, setEntering] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const started = useRef(false);
  const sequenceTimer = useRef(null);
  const completionTimer = useRef(null);

  const startEntry = useCallback((skip = false) => {
    if (started.current) return;
    started.current = true;
    window.clearTimeout(sequenceTimer.current);
    setSkipped(skip);
    setEntering(true);
    onReveal(skip);
    completionTimer.current = window.setTimeout(onComplete, skip ? 300 : 1200);
  }, [onComplete, onReveal]);

  useEffect(() => {
    if (reducedMotion) {
      onReveal(true);
      onComplete();
      return undefined;
    }

    sequenceTimer.current = window.setTimeout(() => startEntry(), 3550);
    return () => {
      window.clearTimeout(sequenceTimer.current);
      window.clearTimeout(completionTimer.current);
    };
  }, [onComplete, onReveal, reducedMotion, startEntry]);

  if (reducedMotion) return null;

  const photos = memories.slice(0, 3);
  const rotations = [-13, 12, -5];

  return (
    <Motion.div
      className={`intro-experience${entering ? " is-entering" : ""}${skipped ? " is-skipped" : ""}`}
      role="status"
      aria-label="Entering the DreamScape memory universe"
      initial={{ opacity: 1 }}
      animate={{ opacity: entering ? 0 : 1 }}
      transition={{ duration: skipped ? 0.28 : 1.2, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="intro-stars" aria-hidden="true">
        {particles.map(([x, y], index) => (
          <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%`, "--delay": `${index * -0.37}s` }} />
        ))}
      </div>

      <div className="intro-light" aria-hidden="true" />
      <div className="intro-universe" aria-hidden="true">
        <div className="intro-ring intro-ring-one" />
        <div className="intro-ring intro-ring-two" />
        <div className="intro-ring intro-ring-three" />
        <div className="intro-portal">
          <div className="intro-portal-reflection" />
          <div className="intro-portal-core" />
        </div>

        <div className="intro-photo-orbit">
          {photos.map((memory, index) => (
            <Motion.div
              className={`intro-polaroid intro-polaroid-${index}`}
              key={memory.id}
              initial={{ opacity: 0, scale: 0.72, z: -80, rotate: rotations[index] - 8 }}
              animate={{
                opacity: [0, 1, 1, 0.84],
                scale: [0.72, 1, 1.04, 1.14],
                z: [-80, 0, 30, 120],
                rotate: [rotations[index] - 8, rotations[index], rotations[index] + 2, rotations[index] + 8],
              }}
              transition={{ duration: 3.5, delay: 1.35 + index * 0.16, ease: "easeInOut" }}
            >
              <img src={memory.image} alt="" />
              <span>{memory.title}</span>
            </Motion.div>
          ))}
        </div>
      </div>

      <Motion.p
        className="intro-message"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.65, duration: 0.8 }}
      >
        Every memory begins somewhere.
      </Motion.p>

      <button className="intro-skip" onClick={() => startEntry(true)} disabled={entering}>
        Skip intro <ArrowUpRight size={14} />
      </button>
    </Motion.div>
  );
}

export default IntroExperience;
