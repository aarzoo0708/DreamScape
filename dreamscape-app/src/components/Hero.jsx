
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Heart } from "lucide-react";

function Hero({ onShowNote }) {
  return (
    <section className="hero" id="home">
      <div className="hero-glow" />

      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        <div className="eyebrow">
          <span className="live-dot" />
          A LITTLE CORNER OF YOUR UNIVERSE
        </div>

        <h1>
          Some moments
          <br />
          deserve to live
          <br />
          <span className="gradient-text">forever.</span>
        </h1>

        <p className="hero-description">
          A home for your favourite memories, the words
          you never want to forget, and the little things
          that make life beautiful.
        </p>

        <div className="hero-actions">
          <a href="#memories" className="primary-button">
            Explore your universe <ArrowRight size={17} />
          </a>

          <button
            className="text-button"
            onClick={onShowNote}
          >
            A little note for you <Heart size={16} />
          </button>
        </div>

        <div className="hero-caption">
          <span className="caption-line" />
          MADE OF MOMENTS, KEPT WITH LOVE
        </div>
      </motion.div>

      <motion.div
        className="hero-art"
        initial={{ opacity: 0, scale: 0.9, rotate: 3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.1, delay: 0.2 }}
      >
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />

        <div className="floating-star star-one">✳</div>
        <div className="floating-star star-two">✦</div>
        <div className="floating-star star-three">✧</div>

        <div className="polaroid polaroid-back">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80"
            alt="A quiet landscape"
          />
          <span>somewhere, someday</span>
        </div>

        <div className="polaroid polaroid-front">
          <img
            src="https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=600&q=85"
            alt="Golden sunlight over a field"
          />
          <span>the days we keep ♡</span>
        </div>

        <div className="floating-note">
          <span className="note-heart">♡</span>
          <div>
            <strong>little things matter</strong>
            <p>more than we know.</p>
          </div>
        </div>
      </motion.div>

      <a className="scroll-cue" href="#memories">
        <ArrowDown size={15} /> SCROLL TO REMEMBER
      </a>
    </section>
  );
}

export default Hero;
