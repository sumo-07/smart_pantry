/**
 * Compresses and downscales an image on the client side before upload.
 * Resizes images to a maximum dimension (default 1280px) preserving aspect ratio,
 * and encodes to JPEG format at the given quality (default 0.8).
 *
 * @param {File|Blob} file - The original image file to compress.
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1920] - Maximum width or height in pixels (Full HD).
 * @param {number} [options.quality=0.90] - JPEG quality between 0 and 1.
 * @param {number} [options.maxSizeThreshold=3145728] - Size threshold in bytes (default 3MB).
 * @param {boolean} [options.force=false] - If true, compress even if below size threshold and dimensions.
 * @returns {Promise<File|Blob>} The compressed image File (or Blob).
 */
export async function compressImage(file, options = {}) {
  const {
    maxDimension = 1920,
    quality = 0.90,
    maxSizeThreshold = 3 * 1024 * 1024, // 3MB threshold
    force = false
  } = options;

  if (!file || !(file instanceof Blob) || (file.type && !file.type.startsWith("image/"))) {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        let { naturalWidth: width, naturalHeight: height } = img;
        if (!width || !height) {
          width = img.width;
          height = img.height;
        }

        const exceedsDimension = width > maxDimension || height > maxDimension;
        const exceedsSize = file.size > maxSizeThreshold;

        // Skip compression if already within limits and force is not set
        if (!force && !exceedsDimension && !exceedsSize && file.type === "image/jpeg") {
          cleanup();
          resolve(file);
          return;
        }

        // Calculate aspect ratio preserving dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }

        // Set white background in case source image has transparency
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // High quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);
        cleanup();

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed blob is larger than original and original was already <= threshold and <= maxDimension, keep original
            if (!exceedsDimension && !exceedsSize && blob.size >= file.size) {
              resolve(file);
              return;
            }

            const rawName = file.name || "pantry_scan.jpg";
            const newName = rawName.replace(/\.[^/.]+$/, "") + ".jpg";

            try {
              const compressedFile = new File([blob], newName, {
                type: "image/jpeg",
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } catch {
              blob.name = newName;
              resolve(blob);
            }
          },
          "image/jpeg",
          quality
        );
      } catch (err) {
        console.warn("Error during image canvas compression:", err);
        cleanup();
        resolve(file);
      }
    };

    img.onerror = (err) => {
      console.warn("Failed to load image for compression:", err);
      cleanup();
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export default compressImage;
