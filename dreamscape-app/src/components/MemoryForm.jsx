import { useEffect, useRef, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Heart, X } from "lucide-react";

function MemoryForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

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
        className="memory-form"
        onSubmit={(event) => onSubmit(event, selectedPhoto)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        <div className="eyebrow">SAVE THIS MOMENT</div>
        <h2>A memory to keep.</h2>
        <p className="form-intro">Give this little moment a name.</p>

        <label htmlFor="memory-title">Memory title</label>
        <input
          id="memory-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="That beautiful Sunday..."
          required
        />

        <label htmlFor="memory-description">A few words about it</label>
        <textarea
          id="memory-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="What made this moment special?"
          rows="3"
        />

        <label htmlFor="memory-photo">Choose a photo (optional)</label>
        <input
          ref={fileInputRef}
          id="memory-photo"
          type="file"
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
            >
              Remove photo
            </button>
          </div>
        )}

        <button type="submit" className="primary-button submit-button">
          Save memory <Heart size={16} />
        </button>

        <p className="form-footnote">
          Memories last only in this page session. Photos use temporary browser
          URLs and are not uploaded to a server.
        </p>
      </Motion.form>
    </div>
  );
}

export default MemoryForm;
