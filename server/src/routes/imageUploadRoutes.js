import { Router } from "express";
import multer from "multer";
import { uploadMemoryImage } from "../controllers/imageUploadController.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(request, file, callback) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Choose a JPEG, PNG, or WebP image.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function receiveImage(request, response, next) {
  upload.single("photo")(request, response, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return response.status(413).json({ success: false, message: "Images must be 5 MB or smaller." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return response.status(400).json({ success: false, message: "Upload one photo at a time." });
    }
    return response.status(error.status || 400).json({
      success: false,
      message: error.message || "We could not read that image. Please try again.",
    });
  });
}

router.post("/memories/upload", receiveImage, uploadMemoryImage);

export default router;
