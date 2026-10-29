import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion as Motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Heart, Pencil, Trash2, X } from "lucide-react";
import { trapModalTab } from "../utils/trapModalTab";

function MemoryCard({ memory, index, liked, onLike, canEdit, onEdit, canDelete, onDelete, timelineMode = false }) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isUpdatingFavourite, setIsUpdatingFavourite] = useState(false);
  const [favouriteError, setFavouriteError] = useState("");
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const favouriteRequestLock = useRef(false);
  const deleteRequestLock = useRef(false);
  const deleteTriggerRef = useRef(null);
  const deleteCloseButtonRef = useRef(null);
  const deleteDialogRef = useRef(null);
  const cardRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const cardY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -18]);
  const cardTilt = useTransform(scrollYProgress, [0, 0.5, 1], [1.2, 0, -1.2]);
  const photos = memory.photos?.length
    ? memory.photos
    : memory.imageUrl
      ? [{ imageUrl: memory.imageUrl, imagePublicId: memory.imagePublicId }]
      : [];

  useEffect(() => setActivePhotoIndex(0), [memory.id, photos.length]);

  function closeDeleteConfirmation() {
    if (deleteRequestLock.current) return;
    setShowDeleteConfirmation(false);
  }

  useEffect(() => {
    if (!showDeleteConfirmation) return undefined;
    const deleteTrigger = deleteTriggerRef.current;
    deleteCloseButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !deleteRequestLock.current) {
        event.preventDefault();
        setShowDeleteConfirmation(false);
        return;
      }
      trapModalTab(event, deleteDialogRef.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (deleteTrigger?.isConnected) deleteTrigger.focus();
    };
  }, [showDeleteConfirmation]);

  return (
    <Motion.article
      ref={cardRef}
      className={`memory-card${timelineMode ? " is-timeline" : ""}`}
      style={reducedMotion ? undefined : { y: cardY, rotateX: cardTilt }}
      initial={reducedMotion ? false : { opacity: 0 }}
      whileInView={reducedMotion ? undefined : { opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.12 }}
    >
      <div
        className="memory-image-wrap"
        style={{ "--card-rotation": memory.rotate }}
      >
        <img src={photos[activePhotoIndex]?.imageUrl || memory.image} alt={memory.title} />
        <span className="memory-tag">{memory.tag}</span>
        {canEdit && (
          <button
            className="edit-memory-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit();
            }}
            type="button"
            aria-label={`Edit ${memory.title}`}
            title="Edit memory"
          >
            <Pencil size={15} />
          </button>
        )}
        {canDelete && (
          <button
            className="delete-memory-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              deleteTriggerRef.current = event.currentTarget;
              setDeleteError("");
              setShowDeleteConfirmation(true);
            }}
            type="button"
            aria-label={`Delete ${memory.title}`}
            title="Delete memory"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          className={`like-button ${liked ? "is-liked" : ""}`}
          onClick={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (favouriteRequestLock.current) return;
            favouriteRequestLock.current = true;
            setIsUpdatingFavourite(true);
            setFavouriteError("");
            try {
              await onLike();
            } catch (error) {
              setFavouriteError(error.message || "Could not update this favourite. Please try again.");
            } finally {
              favouriteRequestLock.current = false;
              setIsUpdatingFavourite(false);
            }
          }}
          type="button"
          disabled={isUpdatingFavourite}
          aria-busy={isUpdatingFavourite}
          aria-label={liked ? `Unlike ${memory.title}` : `Like ${memory.title}`}
          aria-pressed={liked}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
      </div>

      {photos.length > 1 && (
        <div className="memory-photo-thumbnails" aria-label={`${photos.length} photos for ${memory.title}`}>
          {photos.map((photo, photoIndex) => (
            <button
              type="button"
              key={`${photo.imagePublicId || photo.imageUrl}-${photoIndex}`}
              className={photoIndex === activePhotoIndex ? "is-active" : ""}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActivePhotoIndex(photoIndex);
              }}
              aria-label={`Show photo ${photoIndex + 1} of ${photos.length} for ${memory.title}`}
              aria-pressed={photoIndex === activePhotoIndex}
            >
              <img src={photo.imageUrl} alt="" />
            </button>
          ))}
          <span>{activePhotoIndex + 1} / {photos.length}</span>
        </div>
      )}

      <div className="memory-info">
        <span className="memory-date">{memory.date}</span>
        <h3>{memory.title}</h3>
        <p>{memory.description}</p>
        {(memory.location || memory.album) && (
          <div className="memory-location-album">
            {memory.album && <span>{memory.album}</span>}
            {memory.location && <span>{memory.location}</span>}
          </div>
        )}
        {memory.tags?.length > 0 && (
          <div className="memory-tags" aria-label="Memory tags">
            {memory.tags.map((tag) => <span key={tag}>#{tag}</span>)}
          </div>
        )}
        {favouriteError && <p className="favorite-error" role="alert">{favouriteError}</p>}
      </div>
      {showDeleteConfirmation && createPortal(
        <div
          className="modal-backdrop delete-backdrop"
          onClick={closeDeleteConfirmation}
        >
          <div
            ref={deleteDialogRef}
            className="delete-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-label={`Delete ${memory.title}`}
            aria-labelledby={`delete-title-${memory.id}`}
            aria-describedby={`delete-description-${memory.id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={deleteCloseButtonRef}
              type="button"
              className="modal-close"
              onClick={closeDeleteConfirmation}
              disabled={isDeleting}
              aria-label="Cancel deletion"
            >
              <X size={20} />
            </button>
            <div className="eyebrow">REMOVE FROM YOUR COLLECTION</div>
            <h2 id={`delete-title-${memory.id}`}>Delete this memory?</h2>
            <p id={`delete-description-${memory.id}`}>
              “{memory.title}” will be permanently deleted. This cannot be undone.
            </p>
            {deleteError && <p className="delete-error" role="alert">{deleteError}</p>}
            <div className="delete-dialog-actions">
              <button
                type="button"
                className="outline-button"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Keep memory
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={isDeleting}
                aria-busy={isDeleting}
                onClick={async (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (deleteRequestLock.current) return;
                  deleteRequestLock.current = true;
                  setIsDeleting(true);
                  setDeleteError("");
                  try {
                    await onDelete();
                    setShowDeleteConfirmation(false);
                  } catch (error) {
                    setDeleteError(error.message || "Could not delete this memory. Please try again.");
                  } finally {
                    deleteRequestLock.current = false;
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Delete memory"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </Motion.article>
  );
}

export default MemoryCard;
