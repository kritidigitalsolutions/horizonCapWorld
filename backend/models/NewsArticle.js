const mongoose = require("mongoose");

const newsArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Company",
    },
    authorName: {
      type: String,
      default: "Super Admin",
    },
    authorRole: {
      type: String,
      default: "Platform Editorial",
    },
    authorAvatar: {
      type: String,
      default: "",
    },
    publishDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    readTime: {
      type: String,
      default: "4 min read",
    },
    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
      default: "Published",
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsArticle", newsArticleSchema);
