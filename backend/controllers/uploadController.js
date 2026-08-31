const {
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require("../utils/cloudinary");

// @desc    Upload Single File/Image (Multipart Form-Data or Base64) with Auto-Delete on Replacement
// @route   POST /api/upload (or /api/admin/upload, /api/user/upload)
exports.uploadFile = async (req, res) => {
  try {
    const fileBuffer = req.file?.buffer;
    const base64Data = req.body?.file || req.body?.image || req.body?.dataUrl;
    const folder = req.body?.folder || "horizoncap/general";
    const oldUrl = req.body?.oldUrl || req.body?.oldPublicId || req.body?.previousUrl;
    const resourceType = req.body?.resource_type || "auto";

    const fileInput = fileBuffer || base64Data;

    if (!fileInput) {
      return res.status(400).json({
        success: false,
        message: "No file or image data provided for upload.",
      });
    }

    let uploadResult;
    if (oldUrl) {
      // Replaces old asset and auto-deletes from Cloudinary storage
      uploadResult = await replaceCloudinaryAsset(fileInput, oldUrl, {
        folder,
        resource_type: resourceType,
      });
    } else {
      uploadResult = await uploadToCloudinary(fileInput, {
        folder,
        resource_type: resourceType,
      });
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully to Cloudinary.",
      url: uploadResult.secure_url || uploadResult.url,
      secure_url: uploadResult.secure_url || uploadResult.url,
      public_id: uploadResult.public_id,
      resource_type: uploadResult.resource_type,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    console.error("[Cloudinary Upload Controller Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file to Cloudinary.",
    });
  }
};

// @desc    Delete File/Image from Cloudinary Storage
// @route   POST /api/upload/delete (or DELETE /api/upload)
exports.deleteFile = async (req, res) => {
  try {
    const target = req.body?.url || req.body?.public_id || req.body?.oldUrl || req.query?.url;

    if (!target) {
      return res.status(400).json({
        success: false,
        message: "Please provide a Cloudinary URL or public_id to delete.",
      });
    }

    const deleteResult = await deleteFromCloudinary(target, req.body?.resource_type);

    res.status(200).json({
      success: true,
      message: "Asset removed from Cloudinary storage.",
      result: deleteResult,
    });
  } catch (error) {
    console.error("[Cloudinary Delete Controller Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete file from Cloudinary.",
    });
  }
};
