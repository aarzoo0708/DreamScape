import { Sparkles } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#home">
        <Sparkles size={17} /> dreamscape<span className="brand-dot">.</span>
      </a>
      <span>A tiny universe, made just for memories.</span>
      <span>MADE WITH â™¡</span>
    </footer>
  );
}

export default Footer;
