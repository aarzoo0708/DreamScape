import { ArrowRight, BookHeart, CalendarDays, Clock3, Heart, Settings2, Sparkles, Target } from "lucide-react";
import { memoryDateKey } from "../utils/memoryDate";

function isOnThisDay(memory, today) {
  const key = memoryDateKey(memory);
  if (!memory.id || !key) return false;
  const [year, month, day] = key.split("-").map(Number);
  return year < today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
}

function PersonalDashboard({ settings, settingsLoading, settingsError, memories, onNavigate, onShowMemories }) {
  const name = settings.displayName?.trim();
  const recent = [...memories].sort((first, second) => {
    const firstDate = memoryDateKey(first) || "";
    const secondDate = memoryDateKey(second) || "";
    return secondDate.localeCompare(firstDate) || Date.parse(second.createdAt || "") - Date.parse(first.createdAt || "");
  }).slice(0, 3);
  const onThisDay = settings.dashboardShowOnThisDay === false
    ? [] : [...new Map(memories.filter((memory) => isOnThisDay(memory, new Date())).map((memory) => [memory.id, memory])).values()].slice(0, 3);

  return (
    <section className="personal-dashboard" aria-labelledby="personal-welcome">
      <div className="dashboard-welcome">
        <span className="eyebrow"><Sparkles size={14} /> YOUR SPACE</span>
        <h2 id="personal-welcome">{name ? `Welcome, ${name}.` : "A life, kept in moments."}</h2>
        {settings.introduction && <p>{settings.introduction}</p>}
        {settingsLoading && <p className="dashboard-subtle" role="status">Loading your personal touches…</p>}
        {settingsError && <p className="dashboard-error" role="alert">Your saved preferences could not be loaded. Your memories are still here.</p>}
        <nav className="dashboard-nav" aria-label="Personal spaces">
          <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("journal")}><BookHeart size={16} /> Journal</button>
          <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("letters")}><Heart size={16} /> Future letters</button>
          <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("goals")}><Target size={16} /> Dreams & goals</button>
          <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("gratitude")}><Sparkles size={16} /> Little wins</button>
          <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("settings")}><Settings2 size={16} /> Settings</button>
        </nav>
      </div>

      <section className="dashboard-recent" aria-labelledby="recent-memories-heading">
        <div className="dashboard-panel-heading">
          <div><span className="eyebrow">RECENTLY REMEMBERED</span><h3 id="recent-memories-heading">Recent moments</h3></div>
          <button type="button" className="text-button dashboard-navigation-button" onClick={onShowMemories}>All memories <ArrowRight size={16} /></button>
        </div>
        {recent.length ? <div className="dashboard-recent-list">{recent.map((memory) => (
          <button type="button" className="dashboard-recent-memory" key={memory.id} onClick={onShowMemories}>
            <img src={memory.image} alt="" loading="lazy" />
            <span><strong>{memory.title}</strong><small>{memory.date}</small></span>
          </button>
        ))}</div> : <p className="dashboard-subtle">Your first saved memory will find a home here.</p>}
      </section>

      {settings.dashboardShowOnThisDay !== false && (
        <section className="dashboard-on-this-day" aria-labelledby="on-this-day-heading">
          <span className="eyebrow">ON THIS DAY</span>
          <h3 id="on-this-day-heading">A moment from another year</h3>
          {onThisDay.length ? <div>{onThisDay.map((memory) => (
            <button type="button" key={memory.id} onClick={onShowMemories}><span>{memory.title}</span><small>{memory.date}</small></button>
          ))}</div> : <p className="dashboard-subtle">No earlier memories for this date yet.</p>}
        </section>
      )}

      <div className="dashboard-archive-links" aria-label="Memory views">
        <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("timeline")}><Clock3 size={16} /> Life timeline</button>
        <button className="dashboard-navigation-button" type="button" onClick={() => onNavigate("calendar")}><CalendarDays size={16} /> Memory calendar</button>
      </div>
    </section>
  );
}

export default PersonalDashboard;
