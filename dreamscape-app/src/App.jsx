import { AnimatePresence } from "framer-motion";
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
import { getPersonalSettings, savePersonalSettings } from "./api/personal.js";
import PersonalDashboard from "./components/PersonalDashboard";
import PersonalWorkspace from "./components/PersonalWorkspace";
import PageTransition from "./components/PageTransition";
import { LifeTimeline, MemoryCalendar } from "./components/MemoryTimeViews";

const DEFAULT_MEMORY_IMAGE = "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=85";
const DEFAULT_ALBUMS = ["Childhood", "Friends", "Family", "Travel", "Achievements", "Everyday Moments"];
const DEFAULT_SETTINGS = {
  displayName: "",
  introduction: "",
  favouriteQuote: "",
  theme: "midnight",
  customAlbums: [],
  dashboardShowQuote: true,
  dashboardShowOnThisDay: true,
};

function toGalleryMemory(memory) {
  const photos = Array.isArray(memory.photos) && memory.photos.length
    ? memory.photos
    : memory.imageUrl
      ? [{ imageUrl: memory.imageUrl, imagePublicId: memory.imagePublicId || "" }]
      : [];
  return {
    ...memory,
    id: memory._id || memory.id,
    isSaved: Boolean(memory._id),
    isFavourite: Boolean(memory.isFavourite),
    image: photos[0]?.imageUrl || memory.imageUrl || DEFAULT_MEMORY_IMAGE,
    photos,
    album: memory.album || "Everyday Moments",
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
  const [album, setAlbum] = useState("Everyday Moments");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState("");
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
  const [activeView, setActiveView] = useState("home");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [personalSettings, setPersonalSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const memoryLoadRequest = useRef(null);
  const settingsLoadRequest = useRef(null);
  const saveRequestInFlight = useRef(false);
  const deleteRequestsInFlight = useRef(new Set());
  const favouriteRequestsInFlight = useRef(new Set());
  const navigationRef = useRef({ view: "home", showFavourites: false, selectedAlbum: "" });

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

  useEffect(() => {
    let isMounted = true;
    const pendingRequest = settingsLoadRequest.current || getPersonalSettings();
    settingsLoadRequest.current = pendingRequest;
    pendingRequest
      .then((settings) => { if (isMounted) setPersonalSettings({ ...DEFAULT_SETTINGS, ...settings }); })
      .catch((error) => { if (isMounted) setSettingsError(error.message); })
      .finally(() => {
        if (settingsLoadRequest.current === pendingRequest) settingsLoadRequest.current = null;
        if (isMounted) setSettingsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    function restoreNavigation(event) {
      const saved = event.state?.dreamscapeView;
      const view = ["home", "timeline", "calendar", "journal", "letters", "goals", "gratitude", "settings"].includes(saved?.view)
        ? saved.view
        : "home";
      const next = {
        view,
        showFavourites: view === "home" && Boolean(saved?.showFavourites),
        selectedAlbum: view === "home" ? (saved?.selectedAlbum || "") : "",
      };
      navigationRef.current = next;
      setActiveView(next.view);
      setShowFavourites(next.showFavourites);
      setSelectedAlbum(next.selectedAlbum);
    }

    window.addEventListener("popstate", restoreNavigation);
    return () => window.removeEventListener("popstate", restoreNavigation);
  }, []);

  useEffect(() => {
    navigationRef.current = { view: activeView, showFavourites, selectedAlbum };
  }, [activeView, showFavourites, selectedAlbum]);

  const allMemories = customMemories;
  const albums = [...new Set([
    ...DEFAULT_ALBUMS,
    ...(personalSettings.customAlbums || []),
    ...allMemories.map((memory) => memory.album).filter(Boolean),
  ])];
  const revealDreamscape = useCallback((skip = false) => {
    setHasEntered(true);
    if (skip) setQuickReveal(true);
  }, []);
  const finishIntro = useCallback(() => setIntroFinished(true), []);

  function navigateToView(view, options = {}) {
    const current = navigationRef.current;
    const next = {
      view,
      showFavourites: view === "home"
        ? (options.showFavourites ?? current.showFavourites)
        : current.showFavourites,
      selectedAlbum: view === "home"
        ? (options.selectedAlbum ?? current.selectedAlbum)
        : current.selectedAlbum,
    };
    const changed = current.view !== next.view
      || current.showFavourites !== next.showFavourites
      || current.selectedAlbum !== next.selectedAlbum;
    if (!changed) return false;

    navigationRef.current = next;
    setActiveView(next.view);
    setShowFavourites(next.showFavourites);
    setSelectedAlbum(next.selectedAlbum);
    window.history.pushState({ dreamscapeView: next }, "", window.location.href);
    return true;
  }

  function openAddMemory() {
    setEditingMemory(null);
    setTitle("");
    setDescription("");
    setMood("");
    setAlbum("Everyday Moments");
    setLocation("");
    setTags("");
    setMemoryDate(new Date().toISOString().slice(0, 10));
    setFormError("");
    setShowForm(true);
  }

  function openEditMemory(memory) {
    setEditingMemory(memory);
    setTitle(memory.title || "");
    setDescription(memory.description || "");
    setMood(memory.mood || "");
    setAlbum(memory.album || "Everyday Moments");
    setLocation(memory.location || "");
    setTags((memory.tags || []).join(", "));
    const savedDate = memory.dateValue || memory.date;
    setMemoryDate(savedDate ? new Date(savedDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setFormError("");
    setShowForm(true);
  }

  async function saveMemory(event, selectedPhotos = []) {
    event.preventDefault();

    if (!title.trim() || saveRequestInFlight.current) return;
    saveRequestInFlight.current = true;
    setIsSavingMemory(true);
    setFormError("");
    setUploadProgress(0);
    try {
      const uploadedPhotos = [];
      for (const [index, photo] of selectedPhotos.entries()) {
        const uploaded = await uploadMemoryPhoto(photo, (photoProgress) => {
          setUploadProgress(Math.round(((index + photoProgress / 100) / selectedPhotos.length) * 100));
        });
        uploadedPhotos.push(uploaded);
      }
      const memoryInput = {
        title: title.trim(),
        description: description.trim() || (editingMemory ? "" : "A moment worth remembering."),
        mood: mood.trim(),
        album: album.trim() || "Everyday Moments",
        location: location.trim(),
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
        date: new Date(`${memoryDate}T12:00:00`).toISOString(),
      };
      if (uploadedPhotos.length) {
        const previousPhotos = editingMemory?.photos?.length
          ? editingMemory.photos
          : editingMemory?.imageUrl
            ? [{ imageUrl: editingMemory.imageUrl, imagePublicId: editingMemory.imagePublicId || "" }]
            : [];
        memoryInput.photos = [...previousPhotos, ...uploadedPhotos];
        if (!editingMemory?.imageUrl) {
          memoryInput.imageUrl = uploadedPhotos[0].imageUrl;
          memoryInput.imagePublicId = uploadedPhotos[0].imagePublicId;
        }
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
      setAlbum("Everyday Moments");
      setLocation("");
      setTags("");
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

  async function persistPersonalSettings(settings) {
    const saved = await savePersonalSettings(settings);
    setPersonalSettings({ ...DEFAULT_SETTINGS, ...saved });
    setSettingsError("");
    return saved;
  }

  function showMemoriesView(favouritesOnly = false, albumName = "") {
    const changed = navigateToView("home", {
      showFavourites: favouritesOnly,
      selectedAlbum: albumName,
    });
    window.setTimeout(
      () => document.getElementById("memories")?.scrollIntoView({ behavior: "smooth" }),
      changed && activeView !== "home" ? 460 : 80,
    );
  }

  function showAboutSection() {
    const changed = navigateToView("home");
    window.setTimeout(
      () => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }),
      changed && activeView !== "home" ? 460 : 80,
    );
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
        data-theme={personalSettings.theme || "midnight"}
        inert={!hasEntered}
      >
        <Navbar
          activeView={activeView}
          showFavourites={showFavourites}
          onNavigate={navigateToView}
          onShowMemories={() => showMemoriesView(false)}
          onShowFavourites={() => showMemoriesView(true)}
          onShowAbout={showAboutSection}
          onAddMemory={openAddMemory}
        />
        <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={activeView} section={activeView}>
        {activeView === "home" ? <>
          <Hero
            onShowNote={openNote}
            memories={allMemories}
            isPageRevealed={hasEntered}
            favouriteQuote={personalSettings.dashboardShowQuote === false ? "" : personalSettings.favouriteQuote}
          />
          <PersonalDashboard
            settings={personalSettings}
            settingsLoading={settingsLoading}
            settingsError={settingsError}
            memories={allMemories}
            onNavigate={navigateToView}
            onShowMemories={() => showMemoriesView(false)}
            onShowFavourites={() => showMemoriesView(true)}
            onOpenAlbum={(albumName) => showMemoriesView(false, albumName)}
          />
          <MemoryGallery
            memories={allMemories}
            albums={albums}
            selectedAlbum={selectedAlbum}
            onAlbumChange={(albumName) => navigateToView("home", { selectedAlbum: albumName })}
            showFavourites={showFavourites}
            onShowAllMemories={() => navigateToView("home", { showFavourites: false })}
            onShowFavourites={() => navigateToView("home", { showFavourites: true })}
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
        </> : activeView === "timeline" ? <LifeTimeline memories={allMemories} actions={{ likedMemoryIds: liked, onLike: toggleLike, onEdit: openEditMemory, onDelete: removeMemory }} isLoading={isLoadingMemories} error={loadError} onRetry={() => setMemoryLoadAttempt((attempt) => attempt + 1)} />
          : activeView === "calendar" ? <MemoryCalendar memories={allMemories} actions={{ likedMemoryIds: liked, onLike: toggleLike, onEdit: openEditMemory, onDelete: removeMemory }} isLoading={isLoadingMemories} error={loadError} onRetry={() => setMemoryLoadAttempt((attempt) => attempt + 1)} /> : (
          <PersonalWorkspace
            key={activeView}
            view={activeView}
            settings={personalSettings}
            settingsLoading={settingsLoading}
            settingsError={settingsError}
            onSaveSettings={persistPersonalSettings}
            onNavigate={navigateToView}
          />
        )}
        </PageTransition>
        </AnimatePresence>
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
          album={album}
          location={location}
          tags={tags}
          albums={albums}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onMoodChange={setMood}
          onDateChange={setMemoryDate}
          onAlbumChange={setAlbum}
          onLocationChange={setLocation}
          onTagsChange={setTags}
          onSubmit={saveMemory}
          onClose={closeMemoryForm}
          error={formError}
          isSaving={isSavingMemory}
          uploadProgress={uploadProgress}
          mode={editingMemory ? "edit" : "add"}
          currentImageUrl={editingMemory?.image || editingMemory?.imageUrl || ""}
          currentPhotos={editingMemory?.photos || []}
        />
      )}
    </main>
  );
}

export default App;
