const NewsArticle = require("../../models/NewsArticle");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require("../../utils/cloudinary");

// @desc    Get All News Articles & Media Broadcasts
// @route   GET /api/admin/news
exports.getAllArticles = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};

    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await NewsArticle.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Article by ID
// @route   GET /api/admin/news/:id
exports.getArticleById = async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }
    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create News Article
// @route   POST /api/admin/news
exports.createArticle = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      bannerUrl: rawBannerUrl,
      category,
      authorName,
      authorRole,
      authorAvatar,
      readTime,
      status,
      tags,
      content,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required.",
      });
    }

    let bannerUrl = rawBannerUrl || "";
    if (bannerUrl && bannerUrl.startsWith("data:")) {
      const uploadRes = await uploadToCloudinary(bannerUrl, {
        folder: "horizoncap/news",
      });
      bannerUrl = uploadRes.secure_url;
    }

    let parsedTags = [];
    if (Array.isArray(tags)) parsedTags = tags;
    else if (typeof tags === "string") parsedTags = tags.split(",").map((t) => t.trim());

    const newArticle = await NewsArticle.create({
      title: title.trim(),
      subtitle: subtitle || "",
      bannerUrl,
      category: category || "Company",
      authorName: authorName || "Super Admin",
      authorRole: authorRole || "Platform Editorial",
      authorAvatar: authorAvatar || "",
      readTime: readTime || "4 min read",
      status: status || "Published",
      tags: parsedTags,
      content,
    });

    res.status(201).json({
      success: true,
      message: "News article created successfully.",
      article: newArticle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update News Article (Auto-deletes old banner from Cloudinary)
// @route   PUT /api/admin/news/:id
exports.updateArticle = async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    let updates = { ...req.body };
    if (typeof updates.tags === "string") {
      updates.tags = updates.tags.split(",").map((t) => t.trim());
    }

    // Handle Banner Image Replacement & Auto-deletion of old file
    if (updates.bannerUrl !== undefined) {
      const oldBanner = article.bannerUrl;
      if (updates.bannerUrl && updates.bannerUrl.startsWith("data:")) {
        const uploadRes = await replaceCloudinaryAsset(updates.bannerUrl, oldBanner, {
          folder: "horizoncap/news",
        });
        updates.bannerUrl = uploadRes.secure_url;
      } else if (oldBanner && oldBanner !== updates.bannerUrl && oldBanner.includes("cloudinary.com")) {
        // Banner changed to another URL or removed, delete previous Cloudinary banner
        deleteFromCloudinary(oldBanner).catch((err) =>
          console.warn("[Cloudinary] Old news banner delete failed:", err.message)
        );
      }
    }

    const updated = await NewsArticle.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "News article updated successfully.",
      article: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete News Article (Purges banner from Cloudinary)
// @route   DELETE /api/admin/news/:id
exports.deleteArticle = async (req, res) => {
  try {
    const article = await NewsArticle.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    // Clean up Cloudinary storage if banner existed
    if (article.bannerUrl && article.bannerUrl.includes("cloudinary.com")) {
      deleteFromCloudinary(article.bannerUrl).catch((err) =>
        console.warn("[Cloudinary] Deleted article banner removal failed:", err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: "News article deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
