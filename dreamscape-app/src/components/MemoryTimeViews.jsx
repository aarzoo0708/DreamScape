import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import MemoryCard from "./MemoryCard";
import { memoryDateKey } from "../utils/memoryDate";

function validMemories(memories) {
  return memories.filter((memory) => memory._id && memoryDateKey(memory));
}

function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function MemoryList({ memories, actions, empty }) {
  if (!memories.length) return <p className="gallery-state" role="status">{empty}</p>;
  return <div className="memory-grid is-timeline">
    {memories.map((memory, index) => <MemoryCard key={memory.id} memory={memory} index={index} timelineMode
      liked={actions.likedMemoryIds.includes(memory.id)} onLike={() => actions.onLike(memory.id, memory.isSaved)}
      canEdit={memory.isSaved} onEdit={() => actions.onEdit(memory)} canDelete={memory.isSaved}
      onDelete={() => actions.onDelete(memory._id)} />)}
  </div>;
}

export function LifeTimeline({ memories, actions, isLoading, error, onRetry }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const dated = useMemo(() => validMemories(memories).sort((a, b) => memoryDateKey(a).localeCompare(memoryDateKey(b)) || String(a.id).localeCompare(String(b.id))), [memories]);
  const years = [...new Set(dated.map((memory) => Number(memoryDateKey(memory).slice(0, 4))))];
  const visible = dated.filter((memory) => Number(memoryDateKey(memory).slice(0, 4)) === year);
  return <section className="time-view personal-workspace" aria-labelledby="time-view-title">
    <header className="workspace-heading"><span className="eyebrow"><Clock3 size={14} /> YOUR STORY, OVER TIME</span><h1 id="time-view-title">Life Timeline.</h1><p>Saved moments, gathered by the day they happened.</p></header>
    <div className="time-view-controls" aria-label="Timeline year navigation">
      <button className="outline-button" type="button" onClick={() => setYear((value) => value - 1)} aria-label="Previous year"><ArrowLeft size={15} /> Previous year</button>
      <label className="sr-only" htmlFor="timeline-year">Choose a year</label>
      <select id="timeline-year" value={year} onChange={(event) => setYear(Number(event.target.value))}>
        {!years.includes(year) && <option value={year}>{year}</option>}{years.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <button className="outline-button" type="button" onClick={() => setYear((value) => value + 1)} aria-label="Next year"><ArrowRight size={15} /> Next year</button>
      <button className="text-button" type="button" onClick={() => setYear(new Date().getFullYear())}>Today</button>
    </div>
    {isLoading ? <p className="gallery-state" role="status">Loading your memories…</p>
      : error ? <div className="gallery-state" role="alert"><p>{error}</p><button className="outline-button" type="button" onClick={onRetry}>Try again</button></div>
        : <><h2 className="time-view-period">{year}</h2><MemoryList memories={visible} actions={actions} empty={dated.length ? `No dated memories from ${year} yet.` : "Your dated memories will appear here as your story grows."} /></>}
  </section>;
}

export function MemoryCalendar({ memories, actions, isLoading, error, onRetry }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(null);
  const dated = useMemo(() => validMemories(memories), [memories]);
  const counts = new Map();
  dated.forEach((memory) => { const key = memoryDateKey(memory); counts.set(key, [...(counts.get(key) || []), memory]); });
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const startOffset = new Date(year, monthIndex, 1).getDay();
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const monthCells = Array.from({ length: Math.ceil((startOffset + days) / 7) * 7 }, (_, index) => index - startOffset + 1);
  const selected = selectedKey && counts.get(selectedKey) ? counts.get(selectedKey) : [];
  return <section className="time-view personal-workspace" aria-labelledby="time-view-title">
    <header className="workspace-heading"><span className="eyebrow"><CalendarDays size={14} /> YOUR DAYS, REMEMBERED</span><h1 id="time-view-title">Memory Calendar.</h1><p>Every glow marks a day with memories saved.</p></header>
    <div className="calendar-layout">
      <section className="memory-calendar" aria-label={monthLabel(year, monthIndex)}>
        <div className="calendar-heading"><button className="outline-button" type="button" aria-label="Previous month" onClick={() => { setMonth(new Date(year, monthIndex - 1, 1)); setSelectedKey(null); }}><ArrowLeft size={16} /></button><h2 aria-live="polite">{monthLabel(year, monthIndex)}</h2><button className="outline-button" type="button" aria-label="Next month" onClick={() => { setMonth(new Date(year, monthIndex + 1, 1)); setSelectedKey(null); }}><ArrowRight size={16} /></button><button className="text-button" type="button" onClick={() => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedKey(null); }}>Current month</button></div>
        <div className="calendar-grid" role="grid" aria-label={monthLabel(year, monthIndex)}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span role="columnheader" key={day}>{day}</span>)}
          {monthCells.map((day, index) => {
            if (day < 1 || day > days) return <span role="gridcell" className="calendar-blank" key={`blank-${index}`} aria-hidden="true" />;
            const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = counts.get(key)?.length || 0;
            return <button role="gridcell" type="button" key={key} className={`calendar-day${count ? " has-memories" : ""}${selectedKey === key ? " is-selected" : ""}`} aria-label={`${monthLabel(year, monthIndex).split(" ")[0]} ${day}${count ? `, ${count} ${count === 1 ? "memory" : "memories"}` : ", no memories"}`} aria-pressed={selectedKey === key} onClick={() => setSelectedKey(key)}><span>{day}</span>{count > 0 && <small>{count}</small>}</button>;
          })}
        </div>
      </section>
      <section className="calendar-selected" aria-live="polite" aria-label="Memories on selected date">
        <h2>{selectedKey ? new Date(`${selectedKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "Choose a day"}</h2>
        {isLoading ? <p className="gallery-state" role="status">Loading your memories…</p> : error ? <div role="alert"><p>{error}</p><button type="button" className="outline-button" onClick={onRetry}>Try again</button></div> : <MemoryList memories={selected} actions={actions} empty={selectedKey ? "No saved memories for this day." : "Select a highlighted date to revisit its memories."} />}
      </section>
    </div>
  </section>;
}
