import { useEffect, useState } from "react";
import { Archive, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createPersonalEntry,
  deletePersonalEntry,
  listPersonalEntries,
  updatePersonalEntry,
} from "../api/personal.js";

const sections = {
  journal: { title: "Daily Journal", eyebrow: "A PLACE TO HEAR YOURSELF", description: "Small notes from the days that make a life." },
  letters: { title: "Letters to Future Me", eyebrow: "SEALED WITH A LITTLE HOPE", description: "Write to the person you are still becoming." },
  goals: { title: "Dreams & Goals", eyebrow: "ONE GENTLE STEP AT A TIME", description: "Keep your hopes close and celebrate the progress." },
  gratitude: { title: "Gratitude & Little Wins", eyebrow: "THE GOOD HIDES IN THE LITTLE THINGS", description: "Save the small bright moments you want to remember." },
};

function dateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function initialForm() {
  return {
    title: "",
    content: "",
    mood: "",
    date: dateInputValue(),
    unlockAt: "",
    description: "",
    progress: 0,
    archived: false,
    kind: "gratitude",
    targetDate: "",
  };
}

function asIsoDate(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59" : "12:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function entryInput(view, form) {
  if (view === "journal") {
    return { title: form.title, content: form.content, mood: form.mood, date: asIsoDate(form.date) };
  }
  if (view === "letters") {
    return { title: form.title, content: form.content, unlockAt: asIsoDate(form.unlockAt, true) };
  }
  if (view === "goals") {
    const progress = Math.min(100, Math.max(0, Number(form.progress) || 0));
    return {
      title: form.title,
      description: form.description,
      progress,
      completed: progress >= 100,
      archived: Boolean(form.archived),
      targetDate: asIsoDate(form.targetDate, true),
    };
  }
  return {
    title: form.title,
    content: form.content,
    date: asIsoDate(form.date),
    kind: form.kind,
  };
}

function displayDate(value) {
  if (!value) return "Date not set";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date not set";
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function PersonalSettingsPanel({ settings, isLoading, error, onSave }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => setForm(settings), [settings]);

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setNotice("");
    try {
      const saved = await onSave({
        displayName: form.displayName,
        introduction: form.introduction,
        favouriteQuote: form.favouriteQuote,
        theme: form.theme,
        customAlbums: String(form.customAlbumsText ?? (form.customAlbums || []).join(", ")).split(",").map((album) => album.trim()).filter(Boolean),
        dashboardShowQuote: Boolean(form.dashboardShowQuote),
        dashboardShowOnThisDay: Boolean(form.dashboardShowOnThisDay),
      });
      setForm({ ...saved, customAlbumsText: (saved.customAlbums || []).join(", ") });
      setNotice("Your personal space has been saved.");
    } catch (saveFailure) {
      setSaveError(saveFailure.message || "Your settings could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <p className="workspace-state" role="status">Loading your settings…</p>;

  return (
    <form className="workspace-form settings-form" onSubmit={submit}>
      <label>Display name
        <input value={form.displayName || ""} maxLength={80} onChange={(event) => change("displayName", event.target.value)} placeholder="What should this space call you?" />
      </label>
      <label>A few words about you
        <textarea value={form.introduction || ""} maxLength={500} rows={3} onChange={(event) => change("introduction", event.target.value)} placeholder="Write a short introduction for your home page." />
      </label>
      <label>Your favourite quote
        <textarea value={form.favouriteQuote || ""} maxLength={500} rows={2} onChange={(event) => change("favouriteQuote", event.target.value)} placeholder="A line you want to keep close." />
      </label>
      <label>Visual accent
        <select value={form.theme || "midnight"} onChange={(event) => change("theme", event.target.value)}>
          <option value="midnight">Midnight lavender</option>
          <option value="rose">Soft rose</option>
          <option value="lavender">Evening lavender</option>
        </select>
      </label>
      <label>Custom album names
        <input value={form.customAlbumsText ?? (form.customAlbums || []).join(", ")} maxLength={1200} onChange={(event) => change("customAlbumsText", event.target.value)} placeholder="One name per comma, like Reading, Home" />
      </label>
      <label className="workspace-checkbox"><input type="checkbox" checked={form.dashboardShowQuote !== false} onChange={(event) => change("dashboardShowQuote", event.target.checked)} /> Show my quote on the home dashboard</label>
      <label className="workspace-checkbox"><input type="checkbox" checked={form.dashboardShowOnThisDay !== false} onChange={(event) => change("dashboardShowOnThisDay", event.target.checked)} /> Show On This Day memories</label>
      {error && <p className="workspace-error" role="alert">Settings could not be refreshed: {error}</p>}
      {saveError && <p className="workspace-error" role="alert">{saveError}</p>}
      {notice && <p className="workspace-notice" role="status">{notice}</p>}
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? "Saving…" : "Save preferences"} <Check size={16} />
      </button>
    </form>
  );
}

function PersonalWorkspace({ view, settings, settingsLoading, settingsError, onSaveSettings, onNavigate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(view !== "settings");
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (view === "settings") return undefined;
    let active = true;
    setLoading(true);
    setLoadError("");
    listPersonalEntries(view)
      .then((records) => { if (active) setEntries(records); })
      .catch((failure) => { if (active) setLoadError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, reload]);

  useEffect(() => {
    setForm(initialForm());
    setEditingId("");
    setConfirmDeleteId("");
    setError("");
  }, [view]);

  const config = sections[view];
  const sectionNavigation = [
    ["home", "Home"],
    ["timeline", "Life Timeline"],
    ["calendar", "Memory Calendar"],
    ["journal", "Daily Journal"],
    ["letters", "Future Letters"],
    ["goals", "Dreams & Goals"],
    ["gratitude", "Little Wins"],
    ["settings", "Settings"],
  ];
  const navigation = (
    <nav className="workspace-section-nav" aria-label="Your personal sections">
      {sectionNavigation.map(([key, label]) => (
        <button type="button" key={key} className={view === key ? "is-active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => onNavigate(key)}>{label}</button>
      ))}
    </nav>
  );
  if (view === "settings") {
    return (
      <section className="personal-workspace" aria-labelledby="workspace-title">
        <header className="workspace-heading">
          <span className="eyebrow">YOUR SPACE, YOUR WAY</span>
          <h1 id="workspace-title">Personal settings.</h1>
          <p>Choose what your little universe says and how it feels.</p>
        </header>
        {navigation}
        <PersonalSettingsPanel settings={settings} isLoading={settingsLoading} error={settingsError} onSave={onSaveSettings} />
      </section>
    );
  }

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editEntry(entry) {
    setEditingId(entry._id);
    setConfirmDeleteId("");
    setError("");
    setForm({
      ...initialForm(),
      ...entry,
      date: entry.date ? dateInputValue(new Date(entry.date)) : dateInputValue(),
      unlockAt: entry.unlockAt ? dateInputValue(new Date(entry.unlockAt)) : "",
      targetDate: entry.targetDate ? dateInputValue(new Date(entry.targetDate)) : "",
      progress: entry.progress ?? 0,
    });
  }

  function newEntry() {
    setEditingId("");
    setConfirmDeleteId("");
    setError("");
    setForm(initialForm());
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const input = entryInput(view, form);
      if (editingId) {
        const updated = await updatePersonalEntry(view, editingId, input);
        setEntries((current) => current.map((entry) => entry._id === updated._id ? updated : entry));
        setNotice("Your changes have been saved.");
      } else {
        const created = await createPersonalEntry(view, input);
        setEntries((current) => [created, ...current]);
        setNotice("Saved to your personal journal.");
      }
      newEntry();
    } catch (failure) {
      setError(failure.message || "This entry could not be saved. Your writing is still here.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entryId) {
    if (deletingId) return;
    setDeletingId(entryId);
    setError("");
    try {
      await deletePersonalEntry(view, entryId);
      setEntries((current) => current.filter((entry) => entry._id !== entryId));
      setConfirmDeleteId("");
      if (editingId === entryId) newEntry();
      setNotice("Entry removed from your archive.");
    } catch (failure) {
      setError(failure.message || "This entry could not be deleted. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  function renderFields() {
    if (view === "journal") return <>
      <label>Entry date<input type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} required /></label>
      <label>Title<input value={form.title} maxLength={120} onChange={(event) => setField("title", event.target.value)} required /></label>
      <label>Mood <span className="field-optional">(optional)</span><input value={form.mood} maxLength={60} onChange={(event) => setField("mood", event.target.value)} placeholder="How did today feel?" /></label>
      <label>Your entry<textarea value={form.content} maxLength={20000} rows={6} onChange={(event) => setField("content", event.target.value)} required /></label>
    </>;
    if (view === "letters") return <>
      <label>Letter title<input value={form.title} maxLength={120} onChange={(event) => setField("title", event.target.value)} required /></label>
      <label>Unlock on <span className="field-optional">(optional)</span><input type="date" value={form.unlockAt} onChange={(event) => setField("unlockAt", event.target.value)} /></label>
      <label>Your letter<textarea value={form.content} maxLength={30000} rows={7} onChange={(event) => setField("content", event.target.value)} required /></label>
      <p className="workspace-field-note">A future date seals the letter. The server hides its contents until it unlocks.</p>
    </>;
    if (view === "goals") return <>
      <label>Dream or goal<input value={form.title} maxLength={140} onChange={(event) => setField("title", event.target.value)} required /></label>
      <label>What does it mean to you? <span className="field-optional">(optional)</span><textarea value={form.description} maxLength={4000} rows={3} onChange={(event) => setField("description", event.target.value)} /></label>
      <label>Target date <span className="field-optional">(optional)</span><input type="date" value={form.targetDate} onChange={(event) => setField("targetDate", event.target.value)} /></label>
      <label>Progress: {Number(form.progress) || 0}%<input type="range" min="0" max="100" step="5" value={form.progress} onChange={(event) => setField("progress", Number(event.target.value))} /></label>
      <label className="workspace-checkbox"><input type="checkbox" checked={Boolean(form.archived)} onChange={(event) => setField("archived", event.target.checked)} /> Archive this goal</label>
    </>;
    return <>
      <label>Kind<select value={form.kind} onChange={(event) => setField("kind", event.target.value)}><option value="gratitude">Something I’m grateful for</option><option value="win">A little win</option></select></label>
      <label>Date<input type="date" value={form.date} onChange={(event) => setField("date", event.target.value)} required /></label>
      <label>Title <span className="field-optional">(optional)</span><input value={form.title} maxLength={120} onChange={(event) => setField("title", event.target.value)} /></label>
      <label>Save this little thing<textarea value={form.content} maxLength={5000} rows={4} onChange={(event) => setField("content", event.target.value)} required /></label>
    </>;
  }

  const visibleEntries = view === "goals" ? entries.filter((entry) => showArchived || !entry.archived) : entries;

  return (
    <section className="personal-workspace" aria-labelledby="workspace-title">
      <header className="workspace-heading">
        <span className="eyebrow">{config.eyebrow}</span>
        <h1 id="workspace-title">{config.title}.</h1>
        <p>{config.description}</p>
      </header>
      {navigation}

      <div className="workspace-layout">
        <form className="workspace-form" onSubmit={submit}>
          <div className="eyebrow">{editingId ? "MAKE A LITTLE CHANGE" : "ADD TO YOUR ARCHIVE"}</div>
          {renderFields()}
          {error && <p className="workspace-error" role="alert">{error}</p>}
          <div className="workspace-form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Save entry"} <Check size={16} />
            </button>
            {editingId && <button type="button" className="outline-button" onClick={newEntry} disabled={saving}>Cancel edit</button>}
          </div>
        </form>

        <div className="workspace-archive">
          <div className="workspace-archive-heading">
            <div>
              <div className="eyebrow">KEPT HERE, JUST FOR YOU</div>
              <h2>Your entries</h2>
            </div>
            {view === "goals" && (
              <button type="button" className="text-button" onClick={() => setShowArchived((shown) => !shown)}>
                <Archive size={14} /> {showArchived ? "Hide archived" : "Show archived"}
              </button>
            )}
          </div>
          {notice && <p className="workspace-notice" role="status">{notice}</p>}
          {loading && <p className="workspace-state" role="status">Gathering your entries…</p>}
          {!loading && loadError && <div className="workspace-state" role="alert"><p>{loadError}</p><button type="button" className="outline-button" onClick={() => setReload((value) => value + 1)}>Try again</button></div>}
          {!loading && !loadError && visibleEntries.length === 0 && <p className="workspace-state">{view === "letters" ? "Your future letters will wait here until you write one." : view === "goals" && showArchived ? "No goals in this view yet." : "This page is ready for your first entry."}</p>}
          <div className="workspace-entry-list">
            {visibleEntries.map((entry) => {
              const locked = view === "letters" && entry.locked;
              return (
                <article className={`workspace-entry${locked ? " is-locked" : ""}`} key={entry._id}>
                  <div className="workspace-entry-topline">
                    <span>{view === "journal" || view === "gratitude" ? displayDate(entry.date) : view === "letters" ? (locked ? `Sealed until ${displayDate(entry.unlockAt)}` : entry.unlockAt ? `Opened ${displayDate(entry.unlockAt)}` : "A letter for any day") : entry.archived ? "Archived" : entry.completed ? "Dream realized" : `${entry.progress || 0}% along`}</span>
                    {view === "journal" && entry.mood && <span>{entry.mood}</span>}
                    {view === "gratitude" && <span>{entry.kind === "win" ? "Little win" : "Gratitude"}</span>}
                  </div>
                  <h3>{entry.title || (view === "gratitude" ? "A small bright thing" : "A moment kept")}</h3>
                  <p className="workspace-entry-content">{locked ? "This letter is sealed. Its words will appear when the day arrives." : entry.content || entry.description || ""}</p>
                  {view === "goals" && <div className="goal-progress"><span style={{ width: `${entry.progress || 0}%` }} /></div>}
                  <div className="workspace-entry-actions">
                    {(!locked || view !== "letters") && <button type="button" className="text-button" onClick={() => editEntry(entry)} aria-label={`Edit ${entry.title}`}><Pencil size={14} /> Edit</button>}
                    {confirmDeleteId === entry._id ? <>
                      <span className="field-optional">Delete this entry?</span>
                      <button type="button" className="text-button danger-text-button" onClick={() => removeEntry(entry._id)} disabled={deletingId === entry._id}>{deletingId === entry._id ? "Deleting…" : "Confirm delete"}</button>
                      <button type="button" className="text-button" onClick={() => setConfirmDeleteId("")}><X size={14} /> Keep</button>
                    </> : <button type="button" className="text-button" onClick={() => setConfirmDeleteId(entry._id)} aria-label={`Delete ${entry.title}`}><Trash2 size={14} /> Delete</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalWorkspace;
