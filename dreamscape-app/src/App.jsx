import { useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MemoryGallery from "./components/MemoryGallery";
import ClosingSection from "./components/ClosingSection";
import Footer from "./components/Footer";
import NoteModal from "./components/NoteModal";
import MemoryForm from "./components/MemoryForm";
import memories from "./data/memories.js";

function App() {
  const [liked, setLiked] = useState([]);
  const [showNote, setShowNote] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customMemories, setCustomMemories] = useState([]);

  const allMemories = [...customMemories, ...memories];

  function addMemory(event) {
    event.preventDefault();

    if (!title.trim()) return;

    setCustomMemories([
      {
        date: new Date()
          .toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          .toUpperCase(),
        title,
        description: description || "A moment worth remembering.",
        image:
          "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85",
        rotate: "1deg",
        tag: "YOUR MEMORY",
      },
      ...customMemories,
    ]);

    setTitle("");
    setDescription("");
    setShowForm(false);
  }

  function toggleLike(index) {
    setLiked((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index],
    );
  }

  return (
    <main>
      <Navbar onAddMemory={() => setShowForm(true)} />
      <Hero onShowNote={() => setShowNote(true)} />
      <MemoryGallery
        memories={allMemories}
        liked={liked}
        onAddMemory={() => setShowForm(true)}
        onLike={toggleLike}
      />
      <ClosingSection onAddMemory={() => setShowForm(true)} />
      <Footer />
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
