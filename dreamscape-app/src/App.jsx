import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MemoryGallery from "./components/MemoryGallery";
import ClosingSection from "./components/ClosingSection";
import Footer from "./components/Footer";
import NoteModal from "./components/NoteModal";
import MemoryForm from "./components/MemoryForm";
import memories from "./data/memories.js";
import IntroExperience from "./components/IntroExperience";

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [quickReveal, setQuickReveal] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [liked, setLiked] = useState([]);
  const [showNote, setShowNote] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customMemories, setCustomMemories] = useState([]);
  const uploadedImageUrls = useRef(new Set());

  useEffect(() => {
    const imageUrls = uploadedImageUrls.current;

    return () => {
      imageUrls.forEach((imageUrl) => {
        URL.revokeObjectURL(imageUrl);
      });
    };
  }, []);

  const allMemories = [...customMemories, ...memories];
  const revealDreamscape = useCallback((skip = false) => {
    setHasEntered(true);
    if (skip) setQuickReveal(true);
  }, []);
  const finishIntro = useCallback(() => setIntroFinished(true), []);

  function addMemory(event, photo) {
    event.preventDefault();

    if (!title.trim()) return;

    const image = photo
      ? URL.createObjectURL(photo)
      : "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85";

    if (photo) uploadedImageUrls.current.add(image);

    setCustomMemories([
      {
        id: crypto.randomUUID(),
        date: new Date()
          .toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase(),
        title,
        description: description || "A moment worth remembering.",
        image,
        rotate: "1deg",
        tag: "YOUR MEMORY",
      },
      ...customMemories,
    ]);

    setTitle("");
    setDescription("");
    setShowForm(false);
  }

  function toggleLike(memoryId) {
    setLiked((previous) =>
      previous.includes(memoryId)
        ? previous.filter((item) => item !== memoryId)
        : [...previous, memoryId],
    );
  }

  return (
    <main>
      <div
        className={`dreamscape-page${hasEntered ? " is-revealed" : ""}${quickReveal ? " is-quick-reveal" : ""}`}
        inert={!hasEntered}
      >
        <Navbar onAddMemory={() => setShowForm(true)} />
        <Hero
          onShowNote={() => setShowNote(true)}
          memories={allMemories}
          isPageRevealed={hasEntered}
        />
        <MemoryGallery
          memories={allMemories}
          likedMemoryIds={liked}
          onAddMemory={() => setShowForm(true)}
          onLike={toggleLike}
        />
        <ClosingSection onAddMemory={() => setShowForm(true)} />
        <Footer />
      </div>
      {!introFinished && (
        <IntroExperience
          memories={allMemories}
          onReveal={revealDreamscape}
          onComplete={finishIntro}
        />
      )}
      {showNote && <NoteModal onClose={() => setShowNote(false)} />}
      {showForm && (
        <MemoryForm
          title={title}
          description={description}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSubmit={addMemory}
          onClose={() => setShowForm(false)}
        />
      )}
    </main>
  );
}

export default App;
