import { Sparkles, Plus } from "lucide-react";
import MemoryCard from "./MemoryCard";

function MemoryGallery({ memories, likedMemoryIds, onAddMemory, onLike }) {
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

        <button className="outline-button" onClick={onAddMemory}>
          <Plus size={17} /> New memory
        </button>
      </div>

      <div className="memory-grid">
        {memories.map((memory, index) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            index={index}
            liked={likedMemoryIds.includes(memory.id)}
            onLike={() => onLike(memory.id)}
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
