import { configureCloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function matchesImageSignature(buffer, mimeType) {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimeType === "image/webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

function uploadBuffer(buffer) {
  const cloudinary = configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "dreamscape/memories", resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function uploadMemoryImage(request, response) {
  if (!request.file) {
    return response.status(400).json({ success: false, message: "Choose an image to upload." });
  }
  if (!ALLOWED_TYPES.has(request.file.mimetype) || !matchesImageSignature(request.file.buffer, request.file.mimetype)) {
    return response.status(400).json({
      success: false,
      message: "This file is not a supported JPEG, PNG, or WebP image.",
    });
  }
  if (request.file.size > MAX_IMAGE_SIZE) {
    return response.status(413).json({ success: false, message: "Images must be 5 MB or smaller." });
  }
  if (!isCloudinaryConfigured()) {
    return response.status(503).json({
      success: false,
      message: "Photo uploads are not configured yet. Add the Cloudinary settings to server/.env.",
    });
  }

  try {
    const result = await uploadBuffer(request.file.buffer);
    if (!result?.secure_url) throw new Error("Cloudinary did not return a hosted image URL.");
    return response.status(201).json({
      success: true,
      message: "Image uploaded.",
      data: { imageUrl: result.secure_url, imagePublicId: result.public_id },
    });
  } catch (error) {
    console.error("Cloudinary image upload failed:", error.name || "UploadError");
    return response.status(502).json({
      success: false,
      message: "We could not upload that photo right now. Please try again.",
    });
  }
}
