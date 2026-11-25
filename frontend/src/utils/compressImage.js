/**
 * Loads an image File/Blob onto an aspect-ratio-preserving HTMLCanvasElement.
 *
 * @param {File|Blob} file
 * @param {number} maxDimension
 * @returns {Promise<{canvas: HTMLCanvasElement, width: number, height: number, naturalWidth: number, naturalHeight: number} | null>}
 */
function renderImageToCanvas(file, maxDimension) {
  if (!file || !(file instanceof Blob) || (file.type && !file.type.startsWith("image/"))) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        let width = naturalWidth;
        let height = naturalHeight;

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
          resolve(null);
          return;
        }

        // Set white background in case source image has transparency
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        cleanup();
        resolve({ canvas, width, height, naturalWidth, naturalHeight });
      } catch (err) {
        console.warn("Error rendering image to canvas:", err);
        cleanup();
        resolve(null);
      }
    };

    img.onerror = (err) => {
      console.warn("Failed to load image for canvas processing:", err);
      cleanup();
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses and downscales an image on the client side before upload.
 * Resizes images to a maximum dimension (default 1920px) preserving aspect ratio,
 * and encodes to JPEG format at the given quality (default 0.90).
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

  const rendered = await renderImageToCanvas(file, maxDimension);
  if (!rendered) return file;

  const { canvas, naturalWidth, naturalHeight } = rendered;
  const exceedsDimension = naturalWidth > maxDimension || naturalHeight > maxDimension;
  const exceedsSize = file.size > maxSizeThreshold;

  // Skip compression if already within limits and force is not set
  if (!force && !exceedsDimension && !exceedsSize && file.type === "image/jpeg") {
    return file;
  }

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(file);
          return;
        }

        // Keep original if already within limits and compressed blob isn't smaller
        if (!exceedsDimension && !exceedsSize && blob.size >= file.size) {
          resolve(file);
          return;
        }

        const rawName = file.name || "pantry_scan.jpg";
        const newName = rawName.replace(/\.[^/.]+$/, "") + ".jpg";

        try {
          resolve(new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() }));
        } catch {
          blob.name = newName;
          resolve(blob);
        }
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Creates a lightweight JPEG data URL thumbnail (~40-70 KB) suitable for storing
 * directly inside a Firestore scan document (well under the 1 MB document limit).
 *
 * @param {File|Blob} file - Source image file.
 * @param {Object} [options]
 * @param {number} [options.maxDimension=560] - Max width/height in pixels.
 * @param {number} [options.quality=0.72] - JPEG quality between 0 and 1.
 * @returns {Promise<string|null>} JPEG data URL or null if generation fails.
 */
export async function createThumbnailDataUrl(file, options = {}) {
  const { maxDimension = 560, quality = 0.72 } = options;
  const rendered = await renderImageToCanvas(file, maxDimension);
  if (!rendered) return null;

  try {
    return rendered.canvas.toDataURL("image/jpeg", quality);
  } catch (err) {
    console.warn("Failed to export thumbnail data URL:", err);
    return null;
  }
}

export default compressImage;
