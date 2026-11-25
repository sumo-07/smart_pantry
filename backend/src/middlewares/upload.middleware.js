import multer from "multer";

const storage = multer.memoryStorage();

/**
 * In-memory multipart image upload middleware (10MB file limit).
 */
export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single("image");
