const cloudinary = require("../configs/cloudinary");
const { Readable } = require("stream");

/**
 * Extracts public_id and resource_type from a Cloudinary URL or publicId string
 * @param {string} urlOrPublicId
 * @returns {{ publicId: string, resourceType: string } | null}
 */
const extractPublicId = (urlOrPublicId) => {
  if (!urlOrPublicId || typeof urlOrPublicId !== "string") return null;

  // If already a publicId without protocol
  if (!urlOrPublicId.startsWith("http://") && !urlOrPublicId.startsWith("https://")) {
    return {
      publicId: urlOrPublicId,
      resourceType: "image",
    };
  }

  try {
    // 1. Detect resource type (image, video, raw)
    const resourceMatch = urlOrPublicId.match(/res\.cloudinary\.com\/[^\/]+\/([a-z]+)\/upload\//i);
    const resourceType = resourceMatch ? resourceMatch[1] : "image";

    // 2. Extract everything after /upload/
    const uploadSplit = urlOrPublicId.split(/\/upload\//i);
    if (uploadSplit.length < 2) return null;

    let pathAfterUpload = uploadSplit[1];

    // Check for version string like v1234567890/
    const versionMatch = pathAfterUpload.match(/(?:^|\/)(v\d+)\/(.+)$/);
    if (versionMatch) {
      pathAfterUpload = versionMatch[2];
    } else {
      // Remove any leading transformation segments if present
      const parts = pathAfterUpload.split("/");
      while (
        parts.length > 1 &&
        (parts[0].includes(",") ||
          parts[0].includes("_") ||
          parts[0].startsWith("c_") ||
          parts[0].startsWith("w_") ||
          parts[0].startsWith("h_") ||
          parts[0].startsWith("q_"))
      ) {
        parts.shift();
      }
      pathAfterUpload = parts.join("/");
    }

    // Strip URL query parameters or hash if any
    pathAfterUpload = pathAfterUpload.split("?")[0].split("#")[0];

    // For 'raw' resource type, keep file extension in public_id
    if (resourceType === "raw") {
      return { publicId: pathAfterUpload, resourceType };
    }

    // For 'image' and 'video', strip the trailing file extension (.jpg, .png, .mp4, etc.)
    const publicId = pathAfterUpload.replace(/\.[a-zA-Z0-9]+$/, "");

    return { publicId, resourceType };
  } catch (error) {
    console.error("Error extracting public ID from Cloudinary URL:", error.message);
    return null;
  }
};

/**
 * Uploads a file buffer or base64/URL to Cloudinary
 * @param {Buffer|string} fileInput - Buffer or Base64 data string or remote URL
 * @param {object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<object>}
 */
const uploadToCloudinary = async (fileInput, options = {}) => {
  const uploadOptions = {
    folder: options.folder || "horizoncap/general",
    resource_type: options.resource_type || "auto",
    overwrite: true,
    ...options,
  };

  // If input is a Buffer (e.g. from multer)
  if (Buffer.isBuffer(fileInput)) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      Readable.from(fileInput).pipe(uploadStream);
    });
  }

  // If input is a base64 string, data URI, or URL
  if (typeof fileInput === "string") {
    // If it's already a hosted Cloudinary URL and not a data URI, return as-is
    if (fileInput.startsWith("https://res.cloudinary.com") && !options.forceReupload) {
      return {
        secure_url: fileInput,
        url: fileInput,
        public_id: extractPublicId(fileInput)?.publicId || "",
      };
    }

    return await cloudinary.uploader.upload(fileInput, uploadOptions);
  }

  throw new Error("Invalid file input provided for Cloudinary upload.");
};

/**
 * Deletes a file from Cloudinary storage
 * @param {string} urlOrPublicId - Cloudinary URL or publicId
 * @param {string} [preferredResourceType] - 'image' | 'video' | 'raw'
 * @returns {Promise<{ success: boolean, result?: string, message?: string }>}
 */
const deleteFromCloudinary = async (urlOrPublicId, preferredResourceType) => {
  if (!urlOrPublicId) return { success: false, message: "No URL or publicId provided." };

  const extracted = extractPublicId(urlOrPublicId);
  if (!extracted || !extracted.publicId) {
    return { success: false, message: "Could not parse Cloudinary publicId." };
  }

  const publicId = extracted.publicId;
  const resourceType = preferredResourceType || extracted.resourceType || "image";

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    // If 'not found' on image, try deleting as 'raw' or 'video' just in case
    if (result && result.result === "not found" && !preferredResourceType) {
      const rawResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true,
      });
      if (rawResult && rawResult.result === "ok") {
        return { success: true, result: rawResult.result, publicId };
      }

      const videoResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
        invalidate: true,
      });
      if (videoResult && videoResult.result === "ok") {
        return { success: true, result: videoResult.result, publicId };
      }
    }

    return {
      success: result?.result === "ok",
      result: result?.result,
      publicId,
    };
  } catch (error) {
    console.warn(`[Cloudinary Cleanup Warning] Failed to delete asset '${publicId}':`, error.message);
    return { success: false, error: error.message, publicId };
  }
};

/**
 * Replaces an existing Cloudinary asset by uploading the new one and destroying the old one
 * @param {Buffer|string} newFileInput - Buffer or base64 or file path
 * @param {string} [oldUrlOrPublicId] - Previous Cloudinary asset URL or ID to remove
 * @param {object} [options] - Upload options
 * @returns {Promise<object>} Upload result of the new asset
 */
const replaceCloudinaryAsset = async (newFileInput, oldUrlOrPublicId, options = {}) => {
  // 1. Upload new file first
  const newUploadResult = await uploadToCloudinary(newFileInput, options);

  // 2. If new upload was successful and an old file URL is provided, destroy old asset
  if (oldUrlOrPublicId && typeof oldUrlOrPublicId === "string") {
    // Only delete if old URL is different from the newly generated URL
    if (oldUrlOrPublicId !== newUploadResult.secure_url && oldUrlOrPublicId.includes("cloudinary.com")) {
      // Run deletion asynchronously without blocking
      deleteFromCloudinary(oldUrlOrPublicId).catch((err) => {
        console.warn("[Cloudinary] Async deletion of replaced asset failed:", err.message);
      });
    }
  }

  return newUploadResult;
};

module.exports = {
  uploadToCloudinary,
  extractPublicId,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
};
