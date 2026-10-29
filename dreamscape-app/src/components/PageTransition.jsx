import { motion as Motion, useReducedMotion } from "framer-motion";

const sectionStyles = {
  home: "home",
  timeline: "timeline",
  calendar: "calendar",
  journal: "journal",
  letters: "letters",
  goals: "goals",
  gratitude: "gratitude",
  settings: "settings",
};

function PageTransition({ section, children }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Motion.div
      className="page-transition-frame"
      data-transition-section={sectionStyles[section] || "settings"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeIn" },
      }}
      transition={{
        duration: prefersReducedMotion ? 0.01 : 0.36,
        ease: [0.22, 0.75, 0.25, 1],
      }}
    >
      {!prefersReducedMotion && (
        <div className="page-transition-effects" aria-hidden="true">
          <span className="page-transition-glow" />
          <span className="page-transition-star page-transition-star-one">✦</span>
          <span className="page-transition-star page-transition-star-two">·</span>
          <span className="page-transition-star page-transition-star-three">✧</span>
          <span className="page-transition-star page-transition-star-four">·</span>
        </div>
      )}
      <div className="page-transition-content">{children}</div>
    </Motion.div>
  );
}

export default PageTransition;
