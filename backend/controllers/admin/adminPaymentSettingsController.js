const PaymentMethod = require("../../models/PaymentMethod");
const DepositVideo = require("../../models/DepositVideo");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require("../../utils/cloudinary");

// @desc    Get All Payment Methods
// @route   GET /api/admin/payment-methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const { category, type, status, search } = req.query;
    let query = {};

    if (category && category !== "all") query.category = category;
    if (type && type !== "all") query.type = type;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { accountNumber: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { bankName: { $regex: search, $options: "i" } },
      ];
    }

    const methods = await PaymentMethod.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: methods.length, methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Payment Method
// @route   POST /api/admin/payment-methods
exports.createPaymentMethod = async (req, res) => {
  try {
    const {
      type,
      category,
      name,
      subtitle,
      currency,
      provider,
      accountNumber,
      accountHolder,
      cnic,
      tillId,
      bankName,
      ifsc,
      iban,
      swiftCode,
      upiId,
      branch,
      accountType,
      network,
      networkCode,
      address,
      memo,
      tokens,
      minDeposits,
      minLimit,
      maxLimit,
      confirmationTime,
      qrCodeUrl: rawQrCodeUrl,
      instructions,
      warning,
      isDefault,
      status,
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Payment method name and type are required.",
      });
    }

    let qrCodeUrl = rawQrCodeUrl || "";
    if (qrCodeUrl && qrCodeUrl.startsWith("data:")) {
      const uploadRes = await uploadToCloudinary(qrCodeUrl, {
        folder: "horizoncap/payments",
      });
      qrCodeUrl = uploadRes.secure_url;
    }

    const newMethod = await PaymentMethod.create({
      type,
      category: category || "Mobile E-Wallet",
      name,
      subtitle: subtitle || "",
      currency: currency || "USD",
      provider: provider || "",
      accountNumber: accountNumber || address || "",
      accountHolder: accountHolder || "",
      cnic: cnic || "",
      tillId: tillId || "",
      bankName: bankName || "",
      ifsc: ifsc || "",
      iban: iban || "",
      swiftCode: swiftCode || "",
      upiId: upiId || "",
      branch: branch || "",
      accountType: accountType || "Current Account",
      network: network || "",
      networkCode: networkCode || "",
      address: address || accountNumber || "",
      memo: memo || "",
      tokens: tokens || [],
      minDeposits: minDeposits || [],
      minLimit: minLimit || "$10 USD",
      maxLimit: maxLimit || "$1,000,000 USD",
      confirmationTime: confirmationTime || "Instant / 5 Minutes",
      qrCodeUrl,
      instructions: instructions || "",
      warning: warning || "",
      isDefault: !!isDefault,
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Payment method created successfully.",
      method: newMethod,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Payment Method (including custom QR code with auto-cleanup)
// @route   PUT /api/admin/payment-methods/:id
exports.updatePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found." });
    }

    let updates = { ...req.body };

    if (updates.qrCodeUrl !== undefined) {
      const oldQr = method.qrCodeUrl;
      if (updates.qrCodeUrl && updates.qrCodeUrl.startsWith("data:")) {
        const uploadRes = await replaceCloudinaryAsset(updates.qrCodeUrl, oldQr, {
          folder: "horizoncap/payments",
        });
        updates.qrCodeUrl = uploadRes.secure_url;
      } else if (oldQr && oldQr !== updates.qrCodeUrl && oldQr.includes("cloudinary.com")) {
        deleteFromCloudinary(oldQr).catch((err) =>
          console.warn("[Cloudinary] Old QR code delete failed:", err.message)
        );
      }
    }

    const updated = await PaymentMethod.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Payment method updated successfully.",
      method: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Payment Method (Purges QR Code from Cloudinary)
// @route   DELETE /api/admin/payment-methods/:id
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!method) {
      return res.status(404).json({ success: false, message: "Payment method not found." });
    }

    if (method.qrCodeUrl && method.qrCodeUrl.includes("cloudinary.com")) {
      deleteFromCloudinary(method.qrCodeUrl).catch((err) =>
        console.warn("[Cloudinary] Deleted payment method QR removal failed:", err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Deposit Tutorial Video Settings
// @route   GET /api/admin/payment-methods/tutorial-video
exports.getDepositVideo = async (req, res) => {
  try {
    let video = await DepositVideo.findOne();
    if (!video) {
      video = await DepositVideo.create({});
    }
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Deposit Tutorial Video Settings (Auto-deletes old Cloudinary video)
// @route   PUT /api/admin/payment-methods/tutorial-video
exports.updateDepositVideo = async (req, res) => {
  try {
    let video = await DepositVideo.findOne();
    if (!video) {
      video = new DepositVideo();
    }

    const {
      title,
      subtitle,
      videoType,
      videoUrl,
      youtubeUrl,
      uploadedVideoName,
      instructions,
      status,
    } = req.body;

    const oldVideoUrl = video.videoUrl;

    if (title) video.title = title;
    if (subtitle) video.subtitle = subtitle;
    if (videoType) video.videoType = videoType;

    if (videoUrl !== undefined) {
      if (videoUrl && videoUrl.startsWith("data:")) {
        const uploadRes = await replaceCloudinaryAsset(videoUrl, oldVideoUrl, {
          folder: "horizoncap/videos",
          resource_type: "video",
        });
        video.videoUrl = uploadRes.secure_url;
      } else {
        if (oldVideoUrl && oldVideoUrl !== videoUrl && oldVideoUrl.includes("cloudinary.com")) {
          deleteFromCloudinary(oldVideoUrl, "video").catch((err) =>
            console.warn("[Cloudinary] Old video removal failed:", err.message)
          );
        }
        video.videoUrl = videoUrl;
      }
    }

    if (youtubeUrl !== undefined) video.youtubeUrl = youtubeUrl;
    if (uploadedVideoName !== undefined) video.uploadedVideoName = uploadedVideoName;
    if (instructions !== undefined) video.instructions = instructions;
    if (status !== undefined) video.status = status;

    await video.save();

    res.status(200).json({
      success: true,
      message: "Deposit tutorial video settings updated successfully.",
      video,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
