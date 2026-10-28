import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { trapModalTab } from "../utils/trapModalTab";

function MemoryForm({
  title,
  description,
  mood,
  date,
  onTitleChange,
  onDescriptionChange,
  onMoodChange,
  onDateChange,
  onSubmit,
  onClose,
  error,
  isSaving,
  uploadProgress,
  mode = "add",
  currentImageUrl = "",
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);
  const dialogRef = useRef(null);
  const previewUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
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

  function clearSelectedPhoto() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setSelectedPhoto(null);
    setPhotoPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handlePhotoChange(event) {
    const photo = event.target.files?.[0];
    if (!photo) return;

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    const supportedExtensions = ["jpg", "jpeg", "png", "webp"];
    const extension = photo.name.split(".").pop()?.toLowerCase();
    const hasSupportedType = supportedTypes.includes(photo.type);
    const hasSupportedExtension = supportedExtensions.includes(extension);

    if (!hasSupportedType && !(photo.type === "" && hasSupportedExtension)) {
      clearSelectedPhoto();
      setPhotoError("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (photo.size > 5 * 1024 * 1024) {
      clearSelectedPhoto();
      setPhotoError("Maximum image size is 5 MB.");
      return;
    }

    clearSelectedPhoto();
    const previewUrl = URL.createObjectURL(photo);
    previewUrlRef.current = previewUrl;
    setSelectedPhoto(photo);
    setPhotoPreviewUrl(previewUrl);
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
        onSubmit={(event) => onSubmit(event, selectedPhoto)}
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

        <label htmlFor="memory-date">Memory date</label>
        <input
          id="memory-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          disabled={isSaving}
          required
        />

        <label htmlFor="memory-photo">Choose a photo (optional)</label>
        <input
          ref={fileInputRef}
          id="memory-photo"
          type="file"
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
            JPEG, PNG, or WebP. Maximum file size: 5 MB.
          </p>
        )}
        {photoPreviewUrl && (
          <div className="photo-preview">
            <img src={photoPreviewUrl} alt="Preview of selected memory" />
            <button
              type="button"
              className="outline-button"
              onClick={clearSelectedPhoto}
              disabled={isSaving}
            >
              Remove photo
            </button>
          </div>
        )}
        {!photoPreviewUrl && currentImageUrl && (
          <div className="photo-preview current-memory-photo">
            <img src={currentImageUrl} alt="Current memory photo" />
            <span className="form-footnote">Current photo</span>
          </div>
        )}
        {!photoPreviewUrl && mode === "edit" && !currentImageUrl && (
          <p className="form-footnote">No photo is saved for this memory. The gallery is showing its default image.</p>
        )}

        {error && <p className="photo-error" role="alert">{error}</p>}

        {isSaving && selectedPhoto && (
          <p className="form-footnote" role="status">
            Uploading photo... {uploadProgress}%
          </p>
        )}
        <button type="submit" className="primary-button submit-button" disabled={isSaving}>
          {isSaving ? "Saving..." : mode === "edit" ? "Save changes" : "Save memory"} <Heart size={16} />
        </button>

        <p className="form-footnote">
          {mode === "edit"
            ? "Choose a new photo only if you want to replace the current one. Otherwise, your saved photo will stay as it is."
            : "Your memory and selected photo are saved to the Memories API and Cloudinary."}
        </p>
      </Motion.form>
    </div>
  );
}

export default MemoryForm;
