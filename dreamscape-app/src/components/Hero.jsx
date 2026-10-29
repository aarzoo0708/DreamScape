import { useRef } from "react";
import {
  motion as Motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowRight, Heart } from "lucide-react";

function HeroPhoto({ memory, index, scrollProgress, reducedMotion }) {
  const direction = index === 0 ? -1 : index === 1 ? 1 : 0;
  const startingRotation = Number.parseFloat(memory.rotate) || 0;
  const x = useTransform(scrollProgress, [0, 1], [0, direction * 10]);
  const y = useTransform(scrollProgress, [0, 1], [0, -10]);
  const rotate = useTransform(
    scrollProgress,
    [0, 1],
    [startingRotation, startingRotation + direction * 1.5],
  );
  const scale = useTransform(scrollProgress, [0, 1], [1, 1.01]);
  const opacity = useTransform(scrollProgress, [0, 1], [1, 0.88]);

  return (
    <Motion.div
      className={`polaroid hero-photo hero-photo-${index}`}
      style={
        reducedMotion ? undefined : { x, y, rotate, scale, opacity }
      }
    >
      <div className="hero-photo-image-placeholder" aria-hidden="true" />
      <img
        src={memory.image}
        alt=""
        onError={(event) => {
          event.currentTarget.parentElement?.classList.add("has-image-placeholder");
        }}
      />
      <span>{memory.title}</span>
    </Motion.div>
  );
}

function Hero({ onShowNote, memories = [], isPageRevealed = true, favouriteQuote = "" }) {
  const heroRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const copyOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.68, 0.9, 1],
    [1, 1, 0.45, 0, 0],
  );
  const copyY = useTransform(scrollYProgress, [0, 0.65, 1], [0, -32, -110]);
  const artOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, 0.24]);
  const artY = useTransform(scrollYProgress, [0, 1], [0, -38]);
  const artScale = useTransform(scrollYProgress, [0, 1], [1, 1.045]);
  const artRotateX = useTransform(scrollYProgress, [0, 1], [0, 3]);
  const portalScale = useTransform(scrollYProgress, [0, 0.55, 1], [0.76, 0.94, 1.28]);
  const portalOpacity = useTransform(
    scrollYProgress,
    [0, 0.35, 0.8, 1],
    [0.42, 0.78, 0.68, 0.18],
  );
  const cueOpacity = useTransform(scrollYProgress, [0, 0.75, 0.96, 1], [1, 1, 0.2, 0]);
  const photos = memories.slice(0, 2);

  return (
    <section className="hero cinematic-hero" id="home" ref={heroRef}>
      <div className="hero-sticky">
        <div className="hero-atmosphere" aria-hidden="true">
          <div className="hero-stars" />
          <div className="hero-glow" />
          <span className="hero-particle hero-particle-one" />
          <span className="hero-particle hero-particle-two" />
          <span className="hero-particle hero-particle-three" />
        </div>

        <div className="hero-portal-wrap" aria-hidden="true">
          <Motion.div
            className="hero-portal"
            style={
              reducedMotion
                ? undefined
                : { scale: portalScale, opacity: portalOpacity }
            }
          >
            <span className="hero-portal-core" />
          </Motion.div>
        </div>

        <Motion.div
          className="hero-copy cinematic-copy"
          style={reducedMotion ? undefined : { opacity: copyOpacity, y: copyY }}
        >
          <div className="eyebrow">
            <span className="live-dot" />A LITTLE CORNER OF YOUR UNIVERSE
          </div>

          <h1>
            <Motion.span
              className="hero-title-line"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={isPageRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, delay: 0.1 }}
            >
              Some moments deserve to
            </Motion.span>
            <Motion.span
              className="hero-title-line"
              initial={reducedMotion ? false : { opacity: 0, y: 20 }}
              animate={isPageRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, delay: 0.24 }}
            >
              <span className="gradient-text">live forever.</span>
            </Motion.span>
          </h1>

          <p className="hero-subtitle">Your memories, your universe.</p>
          <p className="hero-description">
            A home for your favourite memories, the words you never want to
            forget, and the little things that make life beautiful.
          </p>
          {favouriteQuote && <blockquote className="hero-quote">“{favouriteQuote}”</blockquote>}

          <div className="hero-actions">
            <a href="#memories" className="primary-button cinematic-enter">
              Enter Your Dreamscape <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-note-row">
            <button type="button" className="text-button" onClick={onShowNote}>
              A little note for you <Heart size={16} />
            </button>
          </div>

          <div className="hero-caption">
            <span className="caption-line" />
            MADE OF MOMENTS, KEPT WITH LOVE
          </div>
        </Motion.div>

        <Motion.div
          className="hero-art"
          style={
            reducedMotion
              ? undefined
              : { opacity: artOpacity, y: artY, scale: artScale, rotateX: artRotateX }
          }
        >
          <div className="hero-photo-stage">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            {photos.map((memory, index) => (
              <HeroPhoto
                key={memory.id}
                memory={memory}
                index={index}
                scrollProgress={scrollYProgress}
                reducedMotion={reducedMotion}
              />
            ))}
            <div className="floating-note">
              <span className="note-heart"><Heart size={23} /></span>
              <div>
                <strong>little things matter</strong>
                <p>more than we know.</p>
              </div>
            </div>
          </div>
        </Motion.div>

        <div className="hero-bottom-mist" aria-hidden="true" />
        <Motion.a
          className="scroll-cue"
          href="#memories"
          style={reducedMotion ? undefined : { opacity: cueOpacity }}
        >
          <ArrowDown size={15} /> SCROLL TO REMEMBER
        </Motion.a>
      </div>
    </section>
  );
}

export default Hero;
