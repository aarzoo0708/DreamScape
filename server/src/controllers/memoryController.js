import mongoose from "mongoose";
import Memory from "../models/Memory.js";
import { configureCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getMemoryId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new RequestError(400, "Invalid memory ID.");
  }

  return id;
}

function getMemoryInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "A JSON object is required.");
  }

  const input = {};

  if (!partial || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new RequestError(400, "A non-empty title is required.");
    }
    input.title = body.title.trim();
  }

  for (const field of ["description", "imageUrl", "imagePublicId", "mood", "album", "location"]) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string") {
        throw new RequestError(400, `${field} must be a string.`);
      }
      if (field === "imagePublicId" && body[field] && !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(body[field])) {
        throw new RequestError(400, "imagePublicId is not a valid Cloudinary asset ID.");
      }
      if (field === "album" && body[field].trim().length > 80) {
        throw new RequestError(400, "album must be 80 characters or fewer.");
      }
      if (field === "location" && body[field].trim().length > 120) {
        throw new RequestError(400, "location must be 120 characters or fewer.");
      }
      input[field] = body[field].trim();
    }
  }

  if (Object.hasOwn(input, "imageUrl") && input.imageUrl) {
    let url;
    try { url = new URL(input.imageUrl); } catch { throw new RequestError(400, "imageUrl must be an absolute http or https URL."); }
    if (!["http:", "https:"].includes(url.protocol)) throw new RequestError(400, "imageUrl must be an absolute http or https URL.");
  }

  if (Object.hasOwn(body, "tags")) {
    if (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some((tag) => typeof tag !== "string" || tag.length > 40)) {
      throw new RequestError(400, "tags must be a list of at most 20 names, each 40 characters or fewer.");
    }
    input.tags = [...new Set(body.tags.map((tag) => tag.trim()).filter(Boolean))];
  }

  if (Object.hasOwn(body, "photos")) {
    if (!Array.isArray(body.photos) || body.photos.length > 12) {
      throw new RequestError(400, "A memory can have at most 12 photos.");
    }
    input.photos = body.photos.map((photo) => {
      if (!photo || typeof photo !== "object" || Array.isArray(photo)) {
        throw new RequestError(400, "Each photo must include its hosted image and asset ID.");
      }
      if (typeof photo.imageUrl !== "string" || !photo.imageUrl.trim()) {
        throw new RequestError(400, "Each photo must include its hosted image URL.");
      }
      const imagePublicId = typeof photo.imagePublicId === "string" ? photo.imagePublicId.trim() : "";
      if (imagePublicId && !/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(imagePublicId)) {
        throw new RequestError(400, "A photo has an invalid Cloudinary asset ID.");
      }
      let photoUrl;
      try { photoUrl = new URL(photo.imageUrl.trim()); } catch { throw new RequestError(400, "Photo URLs must use http or https."); }
      if (!["http:", "https:"].includes(photoUrl.protocol)) throw new RequestError(400, "Photo URLs must use http or https.");
      return {
        imageUrl: photo.imageUrl.trim(),
        imagePublicId,
        caption: typeof photo.caption === "string" ? photo.caption.trim().slice(0, 240) : "",
      };
    });
  }

  if (Object.hasOwn(body, "isFavourite")) {
    if (typeof body.isFavourite !== "boolean") {
      throw new RequestError(400, "isFavourite must be a boolean.");
    }
    input.isFavourite = body.isFavourite;
  }

  if (Object.hasOwn(body, "date")) {
    if (body.date === null || body.date === "") {
      input.date = null;
    } else {
      const date = new Date(body.date);
      if (Number.isNaN(date.getTime())) {
        throw new RequestError(400, "date must be a valid date.");
      }
      input.date = date;
    }
  }

  if (partial && Object.keys(input).length === 0) {
    throw new RequestError(400, "Provide at least one valid memory field to update.");
  }

  return input;
}

function handleError(error, response, next) {
  if (error instanceof RequestError) {
    return response.status(error.status).json({ success: false, message: error.message });
  }
  return next(error);
}

export async function listMemories(request, response, next) {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    response.json({ success: true, data: memories });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function getMemory(request, response, next) {
  try {
    const memory = await Memory.findById(getMemoryId(request.params.id));
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }
    return response.json({ success: true, data: memory });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function createMemory(request, response, next) {
  try {
    const memory = await Memory.create(getMemoryInput(request.body));
    return response.status(201).json({
      success: true,
      message: "Memory created.",
      data: memory,
    });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function updateMemory(request, response, next) {
  try {
    const memoryId = getMemoryId(request.params.id);
    const input = getMemoryInput(request.body, { partial: true });
    const previousMemory = await Memory.findById(memoryId);
    if (!previousMemory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }

    const memory = await Memory.findByIdAndUpdate(
      memoryId,
      input,
      { returnDocument: "after", runValidators: true },
    );
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }

    let imageCleanupStatus = "not-needed";
    const imageWasReplaced = Object.hasOwn(input, "imageUrl")
      && input.imageUrl !== previousMemory.imageUrl;
    const currentPhotoIds = new Set([
      memory.imagePublicId,
      ...(memory.photos || []).map((photo) => photo.imagePublicId),
    ].filter(Boolean));
    const oldPhotoIds = [...new Set([
      previousMemory.imagePublicId,
      ...(previousMemory.photos || []).map((photo) => photo.imagePublicId),
    ].filter(Boolean))];
    const removedPhotoIds = oldPhotoIds.filter((publicId) => !currentPhotoIds.has(publicId));

    if (removedPhotoIds.length) {
      if (!isCloudinaryConfigured()) {
        imageCleanupStatus = "pending";
      } else {
        try {
          const cloudinary = configureCloudinary();
          const results = await Promise.all(removedPhotoIds.map((publicId) =>
            cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true }),
          ));
          imageCleanupStatus = results.every((result) => result.result === "ok" || result.result === "not found")
            ? (results.some((result) => result.result === "ok") ? "deleted" : "missing")
            : "pending";
        } catch (error) {
          console.error("Replaced Cloudinary image cleanup failed:", error.name || "DeleteError");
          imageCleanupStatus = "pending";
        }
      }
    } else if (imageWasReplaced && !previousMemory.imagePublicId && previousMemory.imageUrl) {
      try {
        imageCleanupStatus = new URL(previousMemory.imageUrl).hostname === "res.cloudinary.com"
          ? "untracked"
          : "not-needed";
      } catch {
        imageCleanupStatus = "not-needed";
      }
    }

    const message = imageCleanupStatus === "pending"
      ? "Memory updated. The previous photo could not be removed from Cloudinary and may remain there."
      : imageCleanupStatus === "untracked"
        ? "Memory updated. The previous Cloudinary photo may remain because its asset ID was not saved."
        : "Memory updated.";
    return response.json({
      success: true,
      message,
      data: memory,
      imageCleanupStatus,
    });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function deleteMemory(request, response, next) {
  let imageStatus = "none";
  try {
    const memoryId = getMemoryId(request.params.id);
    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }

    const imageIsCloudinaryHosted = (() => {
      if (!memory.imageUrl) return false;
      try {
        return new URL(memory.imageUrl).hostname === "res.cloudinary.com";
      } catch {
        return false;
      }
    })();

    const imagePublicIds = [...new Set([
      memory.imagePublicId,
      ...(memory.photos || []).map((photo) => photo.imagePublicId),
    ].filter(Boolean))];

    if (imagePublicIds.length) {
      if (!isCloudinaryConfigured()) {
        return response.status(503).json({
          success: false,
          message: "Cloudinary is unavailable, so the memory was kept. Try again when image storage is available.",
        });
      }

      try {
        const cloudinary = configureCloudinary();
        const results = await Promise.all(imagePublicIds.map((publicId) =>
          cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true }),
        ));
        if (results.some((result) => result.result !== "ok" && result.result !== "not found")) {
          throw new Error("Cloudinary did not confirm deletion of every photo.");
        }
        imageStatus = results.some((result) => result.result === "ok") ? "deleted" : "missing";
      } catch (error) {
        console.error("Cloudinary image deletion failed:", error.name || "DeleteError");
        return response.status(502).json({
          success: false,
          message: "The photo could not be deleted, so the memory was kept. Please try again.",
        });
      }
    } else if (imageIsCloudinaryHosted || memory.photos?.some((photo) => photo.imageUrl)) {
      imageStatus = "untracked";
    }

    const deletedMemory = await Memory.findByIdAndDelete(memoryId);
    if (!deletedMemory) {
      return response.status(404).json({
        success: false,
        message: imageStatus === "deleted"
          ? "The photo was deleted, but the memory was already removed. Refresh the gallery."
          : "Memory not found.",
      });
    }

    const message = imageStatus === "deleted"
      ? "Memory and its Cloudinary photo were deleted."
      : imageStatus === "missing"
        ? "Memory deleted. Its photo was already missing from Cloudinary."
        : imageStatus === "untracked"
          ? "Memory deleted. Its photo may remain in Cloudinary because no asset ID was stored."
        : "Memory deleted.";
    return response.json({ success: true, message, data: deletedMemory, imageStatus });
  } catch (error) {
    if (imageStatus !== "none") {
      return response.status(500).json({
        success: false,
        message: imageStatus === "deleted"
          ? "The photo was deleted, but the memory record could not be removed. It is still visible; try deleting it again."
          : imageStatus === "missing"
            ? "The photo was already missing, but the memory could not be removed. It is still visible; try again."
            : "The memory could not be removed. It is still visible; try again.",
      });
    }
    return handleError(error, response, next);
  }
}
