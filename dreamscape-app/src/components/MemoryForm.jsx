import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { trapModalTab } from "../utils/trapModalTab";

function MemoryForm({
  title,
  description,
  mood,
  date,
  album,
  location,
  tags,
  albums = [],
  onTitleChange,
  onDescriptionChange,
  onMoodChange,
  onDateChange,
  onAlbumChange,
  onLocationChange,
  onTagsChange,
  onSubmit,
  onClose,
  error,
  isSaving,
  uploadProgress,
  mode = "add",
  currentImageUrl = "",
  currentPhotos = [],
}) {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);
  const dialogRef = useRef(null);
  const previewUrlRef = useRef([]);

  useEffect(() => {
    return () => {
      previewUrlRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    document.getElementById("memory-title")?.focus();
    return () => {
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSaving) {
        event.preventDefault();
        onClose();
        return;
      }
      trapModalTab(event, dialogRef.current);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  function clearSelectedPhotos() {
    previewUrlRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlRef.current = [];
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhotoChange(event) {
    const photos = [...(event.target.files || [])];
    if (!photos.length) return;

    const savedPhotoCount = currentPhotos.length || (currentImageUrl ? 1 : 0);
    if (savedPhotoCount + photos.length > 12) {
      clearSelectedPhotos();
      setPhotoError("A memory can have up to 12 photos. Remove a selection or choose fewer files.");
      return;
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    const supportedExtensions = ["jpg", "jpeg", "png", "webp"];
    for (const photo of photos) {
      const extension = photo.name.split(".").pop()?.toLowerCase();
      const hasSupportedType = supportedTypes.includes(photo.type);
      const hasSupportedExtension = supportedExtensions.includes(extension);
      if (!hasSupportedType && !(photo.type === "" && hasSupportedExtension)) {
        clearSelectedPhotos();
        setPhotoError("Choose JPEG, PNG, or WebP images.");
        return;
      }
      if (photo.size > 5 * 1024 * 1024) {
        clearSelectedPhotos();
        setPhotoError("Each image must be 5 MB or smaller.");
        return;
      }
    }

    clearSelectedPhotos();
    const previewUrls = photos.map((photo) => URL.createObjectURL(photo));
    previewUrlRef.current = previewUrls;
    setSelectedPhotos(photos);
    setPhotoPreviewUrls(previewUrls);
    setPhotoError("");
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <Motion.form
        ref={dialogRef}
        className="memory-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memory-form-title"
        onSubmit={(event) => onSubmit(event, selectedPhotos)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          disabled={isSaving}
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="eyebrow">{mode === "edit" ? "UPDATE THIS MOMENT" : "SAVE THIS MOMENT"}</div>
        <h2 id="memory-form-title">{mode === "edit" ? "Edit this memory." : "A memory to keep."}</h2>
        <p className="form-intro">
          {mode === "edit" ? "Make changes to the details below." : "Give this little moment a name."}
        </p>

        <label htmlFor="memory-title">Memory title</label>
        <input
          id="memory-title"
          value={title}
          disabled={isSaving}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="That beautiful Sunday..."
          required
        />

        <label htmlFor="memory-description">A few words about it</label>
        <textarea
          id="memory-description"
          value={description}
          disabled={isSaving}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="What made this moment special?"
          rows="3"
        />

        <label htmlFor="memory-mood">Mood (optional)</label>
        <input
          id="memory-mood"
          value={mood}
          onChange={(event) => onMoodChange(event.target.value)}
          placeholder="A little peaceful..."
          disabled={isSaving}
        />

        <label htmlFor="memory-album">Album</label>
        <select id="memory-album" value={album} onChange={(event) => onAlbumChange(event.target.value)} disabled={isSaving}>
          {albums.map((albumName) => <option key={albumName} value={albumName}>{albumName}</option>)}
        </select>

        <label htmlFor="memory-location">Location (optional)</label>
        <input id="memory-location" value={location} maxLength={120} onChange={(event) => onLocationChange(event.target.value)} placeholder="A place worth remembering" disabled={isSaving} />

        <label htmlFor="memory-tags">Tags (optional)</label>
        <input id="memory-tags" value={tags} maxLength={800} onChange={(event) => onTagsChange(event.target.value)} placeholder="sunset, weekend, celebration" disabled={isSaving} />

        <label htmlFor="memory-date">Memory date</label>
        <input
          id="memory-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          disabled={isSaving}
          required
        />

        <label htmlFor="memory-photo">Add photos (optional)</label>
        <input
          ref={fileInputRef}
          id="memory-photo"
          type="file"
          multiple
          disabled={isSaving}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handlePhotoChange}
          aria-describedby={photoError ? "photo-error" : "photo-help"}
        />
        {photoError && (
          <p className="photo-error" id="photo-error" role="alert">
            {photoError}
          </p>
        )}
        {!photoError && (
          <p className="form-footnote" id="photo-help">
          JPEG, PNG, or WebP. Up to 12 photos per memory, 5 MB each.
          </p>
        )}
        {(currentPhotos.length > 0 || currentImageUrl) && (
          <div className="memory-photo-preview-grid" aria-label="Photos currently saved to this memory">
            {(currentPhotos.length ? currentPhotos : [{ imageUrl: currentImageUrl }]).map((photo, index) => (
              <img key={`${photo.imagePublicId || photo.imageUrl}-${index}`} src={photo.imageUrl} alt={`Saved memory photo ${index + 1}`} />
            ))}
            <span className="form-footnote">Saved photos</span>
          </div>
        )}
        {photoPreviewUrls.length > 0 && (
          <div className="memory-photo-preview-grid" aria-label="Selected photo previews">
            {photoPreviewUrls.map((url, index) => <img key={url} src={url} alt={`Selected photo preview ${index + 1}`} />)}
            <button type="button" className="outline-button" onClick={clearSelectedPhotos} disabled={isSaving}>Clear selected photos</button>
          </div>
        )}
        {!currentPhotos.length && !currentImageUrl && mode === "edit" && (
          <p className="form-footnote">No photo is saved for this memory. The gallery is showing its default image.</p>
        )}

        {error && <p className="photo-error" role="alert">{error}</p>}

        {isSaving && selectedPhotos.length > 0 && (
          <p className="form-footnote" role="status">
            Uploading photos… {uploadProgress}%
          </p>
        )}
        <button type="submit" className="primary-button submit-button" disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Save memory"} <Heart size={16} />
        </button>

        <p className="form-footnote">
          {mode === "edit"
            ? "Add more photos at any time. Your existing photos stay in this memory."
            : "Your memory and selected photos are saved to your archive and Cloudinary."}
        </p>
      </Motion.form>
    </div>
  );
}

export default MemoryForm;
