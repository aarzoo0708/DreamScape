import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import MemoryGallery from "./components/MemoryGallery";
import ClosingSection from "./components/ClosingSection";
import Footer from "./components/Footer";
import NoteModal from "./components/NoteModal";
import MemoryForm from "./components/MemoryForm";
import IntroExperience from "./components/IntroExperience";
import { createMemory, deleteMemory, getMemories, updateMemory, uploadMemoryPhoto } from "./api/memories";

const DEFAULT_MEMORY_IMAGE = "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85";

function toGalleryMemory(memory) {
  return {
    ...memory,
    id: memory._id || memory.id,
    isSaved: Boolean(memory._id),
    isFavourite: Boolean(memory.isFavourite),
    image: memory.imageUrl || DEFAULT_MEMORY_IMAGE,
    dateValue: memory.date || "",
    date: memory.date
      ? new Date(memory.date).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        }).toUpperCase()
      : "A RECENT MOMENT",
    rotate: "1deg",
    tag: memory.mood || "YOUR MEMORY",
  };
}

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  const [quickReveal, setQuickReveal] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);
  const [liked, setLiked] = useState([]);
  const [showNote, setShowNote] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingMemory, setEditingMemory] = useState(null);
  const [customMemories, setCustomMemories] = useState([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [memoryLoadAttempt, setMemoryLoadAttempt] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [galleryNotice, setGalleryNotice] = useState("");
  const [showFavourites, setShowFavourites] = useState(false);
  const memoryLoadRequest = useRef(null);
  const saveRequestInFlight = useRef(false);
  const deleteRequestsInFlight = useRef(new Set());
  const favouriteRequestsInFlight = useRef(new Set());

  const openNote = useCallback(() => setShowNote(true), []);
  const closeNote = useCallback(() => setShowNote(false), []);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingMemories(true);
    setLoadError("");
    const pendingRequest = memoryLoadRequest.current || getMemories();
    memoryLoadRequest.current = pendingRequest;
    pendingRequest
      .then((records) => {
        if (isMounted) {
          const loadedMemories = records.map(toGalleryMemory);
          const loadedIds = new Set(loadedMemories.map((memory) => memory.id));
          setCustomMemories(loadedMemories);
          setLiked((previous) => [
            ...previous.filter((id) => !loadedIds.has(id)),
            ...loadedMemories.filter((memory) => memory.isFavourite).map((memory) => memory.id),
          ]);
        }
      })
      .catch((error) => {
        if (isMounted) setLoadError(error.message);
      })
      .finally(() => {
        if (memoryLoadRequest.current === pendingRequest) {
          memoryLoadRequest.current = null;
        }
        if (isMounted) setIsLoadingMemories(false);
      });
    return () => { isMounted = false; };
  }, [memoryLoadAttempt]);

  const allMemories = customMemories;
  const revealDreamscape = useCallback((skip = false) => {
    setHasEntered(true);
    if (skip) setQuickReveal(true);
  }, []);
  const finishIntro = useCallback(() => setIntroFinished(true), []);

  function openAddMemory() {
    setEditingMemory(null);
    setTitle("");
    setDescription("");
    setMood("");
    setMemoryDate(new Date().toISOString().slice(0, 10));
    setFormError("");
    setShowForm(true);
  }

  function openEditMemory(memory) {
    setEditingMemory(memory);
    setTitle(memory.title || "");
    setDescription(memory.description || "");
    setMood(memory.mood || "");
    setMemoryDate(memory.date ? new Date(memory.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormError("");
    setShowForm(true);
  }

  async function saveMemory(event, photo) {
    event.preventDefault();

    if (!title.trim() || saveRequestInFlight.current) return;
    saveRequestInFlight.current = true;
    setIsSavingMemory(true);
    setFormError("");
    setUploadProgress(0);
    try {
      const uploadedImage = photo
        ? await uploadMemoryPhoto(photo, setUploadProgress)
        : undefined;
      const memoryInput = {
        title: title.trim(),
        description: description.trim() || (editingMemory ? "" : "A moment worth remembering."),
        mood: mood.trim(),
        date: new Date(`${memoryDate}T12:00:00`).toISOString(),
      };
      if (uploadedImage) {
        memoryInput.imageUrl = uploadedImage.imageUrl;
        memoryInput.imagePublicId = uploadedImage.imagePublicId;
      }
      if (editingMemory) {
        const saved = await updateMemory(editingMemory._id, memoryInput);
        setCustomMemories((previous) => previous.map((memory) =>
          memory.id === saved._id ? toGalleryMemory(saved) : memory,
        ));
        if (saved.cleanupWarning) setGalleryNotice(saved.cleanupWarning);
      } else {
        const saved = await createMemory(memoryInput);
        setCustomMemories((previous) => [toGalleryMemory(saved), ...previous]);
      }
      setTitle("");
      setDescription("");
      setMood("");
      setMemoryDate(new Date().toISOString().slice(0, 10));
      setEditingMemory(null);
      setShowForm(false);
    } catch (error) {
      setFormError(error.message);
    } finally {
      saveRequestInFlight.current = false;
      setIsSavingMemory(false);
    }
  }

  async function removeMemory(memoryId) {
    const normalizedId = String(memoryId ?? "").toLowerCase();
    if (deleteRequestsInFlight.current.has(normalizedId)) {
      throw new Error("This memory is already being deleted. Please wait.");
    }
    deleteRequestsInFlight.current.add(normalizedId);
    setGalleryNotice("");
    try {
      const result = await deleteMemory(memoryId);
      setCustomMemories((previous) => previous.filter(
        (memory) => String(memory.id).toLowerCase() !== normalizedId,
      ));
      setLiked((previous) => previous.filter((id) => String(id).toLowerCase() !== normalizedId));
      setGalleryNotice(result.message || "Memory deleted.");
      return result;
    } finally {
      deleteRequestsInFlight.current.delete(normalizedId);
    }
  }

  function closeMemoryForm() {
    if (saveRequestInFlight.current) return;
    setShowForm(false);
    setEditingMemory(null);
  }

  async function toggleLike(memoryId, isSaved) {
    const wasLiked = liked.includes(memoryId);
    const nextFavourite = !wasLiked;
    const memoryKey = String(memoryId);
    if (isSaved && favouriteRequestsInFlight.current.has(memoryKey)) return;

    if (isSaved) favouriteRequestsInFlight.current.add(memoryKey);
    setLiked((previous) => nextFavourite
      ? (previous.includes(memoryId) ? previous : [...previous, memoryId])
      : previous.filter((item) => item !== memoryId),
    );

    if (!isSaved) return;
    try {
      const saved = await updateMemory(memoryId, { isFavourite: nextFavourite });
      const updatedMemory = toGalleryMemory(saved);
      setCustomMemories((previous) => previous.map((memory) =>
        memory.id === saved._id ? updatedMemory : memory,
      ));
      setLiked((previous) => saved.isFavourite
        ? (previous.includes(memoryId) ? previous : [...previous, memoryId])
        : previous.filter((item) => item !== memoryId),
      );
    } catch (error) {
      setLiked((previous) => wasLiked
        ? (previous.includes(memoryId) ? previous : [...previous, memoryId])
        : previous.filter((item) => item !== memoryId),
      );
      setCustomMemories((previous) => previous.map((memory) =>
        memory.id === memoryId ? { ...memory, isFavourite: wasLiked } : memory,
      ));
      throw error;
    } finally {
      favouriteRequestsInFlight.current.delete(memoryKey);
    }
  }

  return (
    <main>
      <div
        className={`dreamscape-page${hasEntered ? " is-revealed" : ""}${quickReveal ? " is-quick-reveal" : ""}`}
        inert={!hasEntered}
      >
        <Navbar
          onAddMemory={openAddMemory}
          onShowFavourites={() => setShowFavourites(true)}
        />
        <Hero
          onShowNote={openNote}
          memories={allMemories}
          isPageRevealed={hasEntered}
        />
        <MemoryGallery
          memories={allMemories}
          showFavourites={showFavourites}
          onShowAllMemories={() => setShowFavourites(false)}
          onShowFavourites={() => setShowFavourites(true)}
          isLoading={isLoadingMemories}
          error={loadError}
          onRetry={() => setMemoryLoadAttempt((attempt) => attempt + 1)}
          likedMemoryIds={liked}
          onAddMemory={openAddMemory}
          onLike={toggleLike}
          onEdit={openEditMemory}
          onDelete={removeMemory}
          galleryNotice={galleryNotice}
        />
        <ClosingSection onAddMemory={openAddMemory} />
        <Footer />
      </div>
      {!introFinished && (
        <IntroExperience
          memories={allMemories}
          onReveal={revealDreamscape}
          onComplete={finishIntro}
        />
      )}
      {showNote && <NoteModal onClose={closeNote} />}
      {showForm && (
        <MemoryForm
          key={editingMemory?._id || "new-memory"}
          title={title}
          description={description}
          mood={mood}
          date={memoryDate}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onMoodChange={setMood}
          onDateChange={setMemoryDate}
          onSubmit={saveMemory}
          onClose={closeMemoryForm}
          error={formError}
          isSaving={isSavingMemory}
          uploadProgress={uploadProgress}
          mode={editingMemory ? "edit" : "add"}
          currentImageUrl={editingMemory?.imageUrl || ""}
        />
      )}
    </main>
  );
}

export default App;
