import { useMemo, useState } from "react";
import { Heart, Plus, Search, Sparkles, X } from "lucide-react";
import MemoryCard from "./MemoryCard";

function getDateKey(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function MemoryGallery({
  memories,
  likedMemoryIds,
  onAddMemory,
  onLike,
  onEdit,
  onDelete,
  isLoading,
  error,
  onRetry,
  galleryNotice,
  showFavourites,
  onShowAllMemories,
  onShowFavourites,
}) {
  const [search, setSearch] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const moods = useMemo(() => [...new Set(
    memories.map((memory) => memory.mood?.trim()).filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })), [memories]);

  const baseMemories = showFavourites
    ? memories.filter((memory) => memory.isFavourite)
    : memories;
  const filteredMemories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const matches = baseMemories.filter((memory) => {
      if (query && !`${memory.title || ""} ${memory.description || ""}`.toLocaleLowerCase().includes(query)) {
        return false;
      }
      if (selectedMood && memory.mood?.trim() !== selectedMood) return false;

      if (startDate || endDate) {
        const dateKey = getDateKey(memory.dateValue ?? memory.date);
        if (!dateKey || (startDate && dateKey < startDate) || (endDate && dateKey > endDate)) {
          return false;
        }
      }
      return true;
    });

    return matches.sort((first, second) => {
      if (sortOrder === "title") {
        return (first.title || "").localeCompare(second.title || "", undefined, {
          sensitivity: "base",
          numeric: true,
        });
      }

      const firstDate = getDateKey(first.dateValue ?? first.date);
      const secondDate = getDateKey(second.dateValue ?? second.date);
      if (!firstDate && !secondDate) return 0;
      if (!firstDate) return 1;
      if (!secondDate) return -1;
      return sortOrder === "oldest"
        ? firstDate.localeCompare(secondDate)
        : secondDate.localeCompare(firstDate);
    });
  }, [baseMemories, search, selectedMood, startDate, endDate, sortOrder]);

  const hasActiveFilters = Boolean(
    search.trim() || selectedMood || startDate || endDate || sortOrder !== "newest",
  );
  const invalidDateRange = Boolean(startDate && endDate && startDate > endDate);

  function resetFilters() {
    setSearch("");
    setSelectedMood("");
    setStartDate("");
    setEndDate("");
    setSortOrder("newest");
  }

  let emptyMessage = "Your memory gallery is ready. Add your first moment to begin.";
  if (hasActiveFilters) emptyMessage = "No memories match your search and filters. Try changing or clearing them.";
  else if (showFavourites) emptyMessage = "No favourites yet. Tap the heart on a memory to keep it here.";

  return (
    <section className="memory-section" id="memories">
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL TIME MACHINE</div>
          <h2>
            Moments worth <span className="serif-accent">keeping.</span>
          </h2>
          <p className="section-description">
            Tiny pieces of life, saved in one beautiful place.
          </p>
        </div>

        <div className="gallery-heading-actions">
          <div className="gallery-filters" role="group" aria-label="Choose memory view">
            <button
              type="button"
              className={`outline-button gallery-filter-button${showFavourites ? "" : " is-active"}`}
              onClick={onShowAllMemories}
              aria-pressed={!showFavourites}
            >
              All memories
            </button>
            <button
              type="button"
              className={`outline-button gallery-filter-button${showFavourites ? " is-active" : ""}`}
              onClick={onShowFavourites}
              aria-pressed={showFavourites}
            >
              <Heart size={14} /> Favourites
            </button>
          </div>
          <button type="button" className="outline-button" onClick={onAddMemory}>
            <Plus size={17} /> New memory
          </button>
        </div>
      </div>

      <div className="gallery-tools">
        <div className="gallery-search-row">
          <label className="gallery-search" htmlFor="memory-search">
            <Search size={17} aria-hidden="true" />
            <input
              id="memory-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles and descriptions"
              autoComplete="off"
            />
          </label>
          {search && (
            <button
              type="button"
              className="gallery-clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <div className="gallery-filter-controls">
          <label className="gallery-control">
            <span>Mood</span>
            <select value={selectedMood} onChange={(event) => setSelectedMood(event.target.value)}>
              <option value="">All moods</option>
              {moods.map((mood) => <option key={mood} value={mood}>{mood}</option>)}
            </select>
          </label>
          <label className="gallery-control">
            <span>From</span>
            <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label className="gallery-control">
            <span>To</span>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <label className="gallery-control">
            <span>Sort by</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
          {hasActiveFilters && (
            <button type="button" className="gallery-reset-button" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {!isLoading && !error && (
        <p className="gallery-result-count" aria-live="polite">
          {invalidDateRange
            ? "Choose a start date on or before the end date."
            : `${filteredMemories.length} ${filteredMemories.length === 1 ? "memory" : "memories"}${hasActiveFilters ? " found" : ""}`}
        </p>
      )}

      <div className="memory-grid" aria-busy={isLoading}>
        {galleryNotice && <p className="gallery-notice" role="status">{galleryNotice}</p>}
        {isLoading && <p className="gallery-state" role="status">Loading your memories…</p>}
        {!isLoading && error && (
          <div className="gallery-state gallery-error-state" role="alert">
            <p>{error} Your saved memories could not be loaded.</p>
            <button type="button" className="outline-button" onClick={onRetry}>Try again</button>
          </div>
        )}
        {!isLoading && !error && filteredMemories.length === 0 && (
          <p className="gallery-state gallery-empty-state" role="status">{emptyMessage}</p>
        )}
        {!isLoading && !error && filteredMemories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={index}
            liked={likedMemoryIds.includes(memory.id)}
            onLike={() => onLike(memory.id, memory.isSaved)}
            canEdit={memory.isSaved}
            onEdit={() => onEdit(memory)}
            canDelete={memory.isSaved}
            onDelete={() => onDelete(memory._id)}
          />
        ))}
      </div>

      <div className="memory-bottom">
        <span>AND THERE'S SO MUCH MORE TO COME...</span>
        <Sparkles size={17} />
      </div>
    </section>
  );
}

export default MemoryGallery;
