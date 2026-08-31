import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBinLine, RiCalendarLine, RiEyeLine,
  RiDraftLine, RiSendPlaneLine, RiTimeLine, RiBookOpenLine, RiPriceTag3Line,
  RiUserLine, RiBold, RiItalic, RiUnderline, RiDoubleQuotesL,
  RiListUnordered, RiListOrdered, RiSeparator, RiLightbulbLine,
  RiAlertLine, RiCheckLine, RiCloseLine, RiImageAddLine, RiImageLine,
  RiUploadCloud2Line
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import { newsArticles as initialArticles } from '../data/mockData';
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle
} from '../api/newsApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';

const initialCategories = [
  'Company',
  'Plans',
  'Market',
  'Update',
  'Renewable Energy',
  'Precious Metals'
];

export default function NewsMedia() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Studio Drawer State (Create / Edit)
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [category, setCategory] = useState('Company');
  const [authorName, setAuthorName] = useState('Super Admin');
  const [authorRole, setAuthorRole] = useState('Platform Editorial');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('Published');

  // New Category Inline Adding
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Reader View State
  const [readingArticle, setReadingArticle] = useState(null);
  const [articleToDelete, setArticleToDelete] = useState(null);

  const textareaRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await getAllArticles({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res?.success && Array.isArray(res.articles) && res.articles.length > 0) {
        const formatted = res.articles.map(a => ({
          _id: a._id,
          id: a.customId || a._id,
          title: a.title,
          subtitle: a.subtitle || '',
          bannerUrl: a.bannerUrl || a.image || '',
          category: a.category || 'Company',
          author: typeof a.author === 'object' ? a.author : { name: a.author || 'Super Admin', role: 'Platform Editorial', avatar: 'SA' },
          content: a.content || '',
          excerpt: a.excerpt || a.subtitle || (a.content ? a.content.slice(0, 140) + '...' : ''),
          tags: Array.isArray(a.tags) ? a.tags : (a.tags ? a.tags.split(',') : []),
          status: a.status || 'Published',
          views: String(a.views || '1'),
          readTime: a.readTime || '3 min read',
          date: a.date || (a.createdAt ? a.createdAt.split('T')[0] : '2026-08-20'),
        }));
        setArticles(formatted);
      } else {
        const saved = localStorage.getItem('horizon_news_broadcasts');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setArticles(parsed);
              return;
            }
          } catch (e) {}
        }
        setArticles(initialArticles);
      }
    } catch (err) {
      console.warn('Using fallback news articles data:', err.message);
      setArticles(initialArticles);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Handle Banner Image Upload (Direct Cloudinary upload with live preview and old asset cleanup)
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerUrl(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        const previousBanner = bannerUrl || editingArticle?.bannerUrl;
        const uploadRes = await uploadFileToCloudinary(file, {
          folder: 'horizoncap/news',
          oldUrl: previousBanner,
        });

        if (uploadRes?.secure_url) {
          setBannerUrl(uploadRes.secure_url);
        }
      } catch (err) {
        console.warn('Banner upload to Cloudinary fallback:', err.message);
      }
    }
  };

  // Open Studio Drawer for Creating New Article
  const openNewArticle = () => {
    setEditingArticle(null);
    setTitle('');
    setSubtitle('');
    setBannerUrl('');
    setCategory(categories[0] || 'Company');
    setAuthorName('Super Admin');
    setAuthorRole('Platform Editorial');
    setContent(`## Executive Overview & Strategic Announcement\n\nWrite your engaging introduction here explaining the key value to platform investors...\n\n> "Add an impactful quote from the leadership team here to build investor trust."\n\n### Key Highlights & Specifications\n- **Feature / Milestone 1**: High-impact yield or asset detail.\n- **Security & Custody**: Fully audited and backed by institutional depositories.\n- **Next Steps for Investors**: Immediate actions available on the dashboard.`);
    setTags('Horizon, Capital, SustainableYield');
    setStatus('Published');
    setIsAddingCategory(false);
    setNewCategoryName('');
    setEditorModalOpen(true);
  };

  // Open Studio Drawer for Editing Existing Article
  const openEditArticle = (article) => {
    setEditingArticle(article);
    setTitle(article.title || '');
    setSubtitle(article.subtitle || '');
    setBannerUrl(article.bannerUrl || article.coverImage || '');
    setCategory(article.category || categories[0] || 'Company');
    setAuthorName(article.author?.name || 'Super Admin');
    setAuthorRole(article.author?.role || 'Platform Editorial');
    setContent(article.content || '');
    setTags(Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''));
    setStatus(article.status || 'Published');
    setIsAddingCategory(false);
    setNewCategoryName('');
    setEditorModalOpen(true);
  };

  // Handle Add New Category
  const handleAddNewCategory = (e) => {
    e?.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // Save / Publish Article
  const handleSaveArticle = async (finalStatus = 'Published') => {
    if (!title.trim() && !content.trim()) return;

    const tagArray = tags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const estReadTime = `${Math.max(1, Math.ceil(words / 180))} min read`;

    const articlePayload = {
      title: title || 'Untitled Article',
      subtitle,
      bannerUrl,
      category,
      author: { name: authorName, role: authorRole, avatar: authorName.split(' ').map(n => n[0]).join('') },
      content,
      excerpt: subtitle || content.slice(0, 140) + '...',
      tags: tagArray,
      status: finalStatus,
      readTime: estReadTime,
    };

    try {
      if (editingArticle) {
        await updateArticle(editingArticle._id || editingArticle.id, articlePayload);
      } else {
        await createArticle(articlePayload);
      }
    } catch (err) {
      console.warn('API news operation offline, updating local state:', err.message);
    }

    let updatedArticles;
    if (editingArticle) {
      // Update existing
      updatedArticles = articles.map(art => art.id === editingArticle.id ? {
        ...art,
        ...articlePayload,
        date: new Date().toISOString().slice(0, 10),
      } : art);
    } else {
      // Create new
      const newId = `art-${Date.now()}`;
      const newArticle = {
        id: newId,
        ...articlePayload,
        views: '1',
        date: new Date().toISOString().slice(0, 10),
      };
      updatedArticles = [newArticle, ...articles];
    }

    setArticles(updatedArticles);
    localStorage.setItem('horizon_news_broadcasts', JSON.stringify(updatedArticles));
    window.dispatchEvent(new CustomEvent('horizon-news-change', { detail: updatedArticles }));
    setEditorModalOpen(false);
  };

  // Delete Article
  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    try {
      if (articleToDelete.bannerUrl && articleToDelete.bannerUrl.includes('cloudinary.com')) {
        deleteFileFromCloudinary(articleToDelete.bannerUrl).catch(() => null);
      }
      if (articleToDelete._id || articleToDelete.id) {
        await deleteArticle(articleToDelete._id || articleToDelete.id);
      }
    } catch (err) {
      console.warn('API delete article offline:', err.message);
    }

    const updatedArticles = articles.filter(a => a.id !== articleToDelete.id && a._id !== articleToDelete._id);
    setArticles(updatedArticles);
    localStorage.setItem('horizon_news_broadcasts', JSON.stringify(updatedArticles));
    window.dispatchEvent(new CustomEvent('horizon-news-change', { detail: updatedArticles }));
    if (readingArticle?.id === articleToDelete.id) {
      setReadingArticle(null);
    }
    setArticleToDelete(null);
  };

  // Quick Formatting Toolbar Inserters
  const insertFormatting = (prefix, suffix = '', placeholder = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Live Word & Char stats
  const wordsCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTimeEstimate = `${Math.max(1, Math.ceil(wordsCount / 180))} min read`;

  // Search & Category Filter
  const filtered = articles.filter(article => {
    const q = search.trim().toLowerCase();
    const matchCat = categoryFilter === 'all' || article.category === categoryFilter;
    const matchSearch = !q ||
      article.title.toLowerCase().includes(q) ||
      (article.excerpt || '').toLowerCase().includes(q) ||
      (article.category || '').toLowerCase().includes(q) ||
      (article.author?.name || '').toLowerCase().includes(q);

    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="skeleton w-48 h-8 rounded-lg"></div>
          <div className="skeleton w-32 h-10 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader type="article" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="News & Media Editorial"
        subtitle="Publish articles, institutional reports, market updates & community announcements"
        badge="Media Hub"
        actions={
          <Button variant="primary" icon={<RiAddLine />} onClick={openNewArticle}>
            New Article Studio
          </Button>
        }
      />

      {/* Filter Tabs & Search Bar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            placeholder="Search articles by headline, keywords, author, or category..."
            value={search}
            onChange={setSearch}
            className="flex-1"
          />
          <div className="flex gap-2 overflow-x-auto font-poppins">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                categoryFilter === 'all'
                  ? 'bg-gold-400 text-slate-900 font-semibold shadow-gold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Posts ({articles.length})
            </button>
            {categories.map(cat => {
              const count = articles.filter(a => a.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    categoryFilter === cat
                      ? 'bg-gold-400 text-slate-900 font-semibold shadow-gold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ──────────────── ARTICLES GRID (TALLER BANNER + UPLOAD PHOTO PLACEHOLDER) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {filtered.map((article, i) => (
          <div
            key={article.id}
            className="card overflow-hidden animate-slide-up group hover:shadow-card-hover transition-all flex flex-col justify-between"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div>
              {/* Card Banner Header (Increased height to h-56 for cinematic banner view) */}
              <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                {article.bannerUrl ? (
                  <img
                    src={article.bannerUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // If broken link, hide image and show clean photo icon placeholder
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  /* Clean Minimalist Photo Icon Placeholder */
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 flex flex-col items-center justify-center text-slate-400 gap-1.5 p-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/80 border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400">
                      <RiImageAddLine size={24} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">No Cover Image Uploaded</span>
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full border shadow-2xs bg-white/90 backdrop-blur-xs text-slate-800 border-slate-200/80">
                    {article.category}
                  </span>
                  <Badge variant={article.status === 'Published' ? 'success' : 'warning'}>
                    {article.status}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3 text-[11px] font-medium text-slate-700 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                  {article.readTime || '3 min read'}
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-5 space-y-3">
                <h3
                  onClick={() => setReadingArticle(article)}
                  className="text-base font-semibold text-slate-800 group-hover:text-gold-700 transition-colors line-clamp-2 cursor-pointer leading-snug font-poppins"
                >
                  {article.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed font-poppins">
                  {article.excerpt}
                </p>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {article.tags.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer: Author, Date & Action Buttons */}
            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-300 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-[10px] ring-2 ring-gold-200/80 shadow-2xs">
                  {article.author?.avatar || 'SA'}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 leading-tight">{article.author?.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-slate-400">{article.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Read Full Article Button */}
                <button
                  onClick={() => setReadingArticle(article)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-gold-50 text-slate-600 hover:text-gold-800 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
                  title="Read Article"
                >
                  <RiEyeLine size={14} />
                  <span>Read</span>
                </button>

                {/* Edit in Studio Button */}
                <button
                  onClick={() => openEditArticle(article)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-gold-50 text-slate-600 hover:text-gold-800 text-xs font-medium border border-slate-200 shadow-2xs transition-colors"
                  title="Edit in Studio Drawer"
                >
                  <RiEditLine size={14} />
                  <span>Edit</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => setArticleToDelete(article)}
                  className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 shadow-2xs transition-colors"
                  title="Delete Article"
                >
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center font-poppins">
          <p className="text-slate-400 font-normal">No articles found matching your query.</p>
        </div>
      )}

      {/* ──────────────── BLOG ARTICLE STUDIO DRAWER WITH REAL IMAGE UPLOAD ──────────────── */}
      <Modal
        isOpen={editorModalOpen}
        onClose={() => setEditorModalOpen(false)}
        title={editingArticle ? 'Article Editorial Studio' : 'Create New Article Studio'}
        subtitle="Write and format blog articles with custom banner image upload and categories"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              icon={<RiDraftLine />}
              onClick={() => handleSaveArticle('Draft')}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              icon={<RiSendPlaneLine />}
              onClick={() => handleSaveArticle('Published')}
            >
              Publish to Platform
            </Button>
          </>
        }
      >
        <div className="space-y-4 font-poppins">
          {/* Article Main Headline */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Article Main Headline (H1) *
            </label>
            <input
              type="text"
              placeholder="Enter article title (e.g. Horizon of Capital Crosses $100M AUM)..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-100 outline-none font-poppins transition-all"
            />
          </div>

          {/* Sub-Headline / Deck */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Sub-Headline / Quick Summary
            </label>
            <input
              type="text"
              placeholder="Brief summary or introductory deck..."
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:border-gold-400 outline-none font-poppins transition-all"
            />
          </div>

          {/* ──────────────── PAGE BANNER / COVER IMAGE UPLOAD (FILE PICKER + DRAG & DROP) ──────────────── */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Upload Article Cover Banner
                </label>
                <p className="text-[11px] text-slate-400">Upload a banner image to be displayed at the top of this article card</p>
              </div>

              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1"
                >
                  <RiCloseLine size={14} /> Remove Banner
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={bannerFileInputRef}
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />

            {/* Upload Zone */}
            <div
              onClick={() => bannerFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-gold-400 bg-white rounded-2xl p-4 text-center cursor-pointer transition-colors group"
            >
              {bannerUrl ? (
                <div className="space-y-2">
                  <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                    <img
                      src={bannerUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-medium text-xs gap-2">
                      <RiImageAddLine size={18} /> Click to Replace Image
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 py-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-700 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-2xs">
                    <RiUploadCloud2Line size={24} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Click to Upload Banner Image</p>
                  <p className="text-[11px] text-slate-400">Supports PNG, JPG, WEBP (Recommended: 1200 x 600px)</p>
                </div>
              )}
            </div>

            {/* Optional URL Paste */}
            <div className="flex gap-2 items-center pt-1">
              <input
                type="text"
                placeholder="Or paste direct image URL (https://...)"
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setBannerUrl('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-gold-50 text-[11px] font-medium rounded-xl whitespace-nowrap shadow-2xs"
              >
                Sample 1
              </button>
              <button
                type="button"
                onClick={() => setBannerUrl('https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop')}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-gold-50 text-[11px] font-medium rounded-xl whitespace-nowrap shadow-2xs"
              >
                Sample 2
              </button>
            </div>
          </div>

          {/* ──────────────── CATEGORY SELECTOR + DYNAMIC ADD CATEGORY FIELD ──────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Category *
                </label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-semibold text-gold-700 hover:text-gold-800 underline inline-flex items-center gap-0.5"
                  >
                    <RiAddLine size={12} /> Add New
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="New category..."
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-gold-300 text-xs text-slate-800 outline-none font-poppins"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-2.5 py-1.5 bg-gold-400 text-slate-900 rounded-xl text-xs font-bold shadow-2xs hover:bg-gold-500 transition-colors"
                    title="Add Category"
                  >
                    <RiCheckLine size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(false)}
                    className="p-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs hover:bg-slate-200"
                    title="Cancel"
                  >
                    <RiCloseLine size={14} />
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={e => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-poppins"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">+ Add New Category...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Author Byline
              </label>
              <input
                type="text"
                placeholder="Author name"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-poppins"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Publication Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-poppins"
              >
                <option value="Published">Published (Public)</option>
                <option value="Draft">Draft (Internal)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Tags & Keywords (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. SustainableYield, SolarGrid, AUM, PlatinumVault"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-gold-400 outline-none font-poppins"
            />
          </div>

          {/* ──────────────── WYSIWYG FORMATTING TOOLBAR ──────────────── */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-1 text-xs">
              {/* Headings */}
              <button
                type="button"
                onClick={() => insertFormatting('\n## ', '\n', 'Main Section Heading')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 font-bold transition-colors shadow-2xs"
                title="Insert Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n### ', '\n', 'Sub Section Title')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 font-bold transition-colors shadow-2xs"
                title="Insert Heading 3"
              >
                H3
              </button>

              <span className="h-4 w-px bg-slate-300 mx-1"></span>

              {/* Bold / Italic / Underline */}
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Bold"
              >
                <RiBold size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Italic"
              >
                <RiItalic size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('<u>', '</u>', 'underlined text')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Underline"
              >
                <RiUnderline size={15} />
              </button>

              <span className="h-4 w-px bg-slate-300 mx-1"></span>

              {/* Quotes & Callouts */}
              <button
                type="button"
                onClick={() => insertFormatting('\n> "', '"\n> — Executive Quote Source', 'Insert inspiring quote here')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Blockquote"
              >
                <RiDoubleQuotesL size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n- ', '', 'List item')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Bullet List"
              >
                <RiListUnordered size={15} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n1. ', '', 'Numbered step')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Numbered List"
              >
                <RiListOrdered size={15} />
              </button>

              <span className="h-4 w-px bg-slate-300 mx-1"></span>

              {/* Pro Tip Callout Box */}
              <button
                type="button"
                onClick={() => insertFormatting('\n> **Pro Tip**: ', '\n', 'Crucial guidance for investors')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold hover:bg-amber-100 transition-colors shadow-2xs text-[11px]"
                title="Insert Callout"
              >
                <RiLightbulbLine size={13} className="text-amber-600" />
                <span>Callout Box</span>
              </button>

              {/* Horizontal Divider */}
              <button
                type="button"
                onClick={() => insertFormatting('\n\n---\n\n', '', '')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-gold-50 hover:text-gold-800 text-slate-700 transition-colors shadow-2xs"
                title="Horizontal Divider"
              >
                <RiSeparator size={15} />
              </button>
            </div>

            {/* Article Content Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write the full article content using headings (##), quotes (>), and bullet points (-)..."
              className="w-full p-4 min-h-[260px] bg-white text-xs font-mono text-slate-700 leading-relaxed outline-none resize-y"
            />

            {/* Live Stats Footer Bar */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 font-poppins">
              <span>{wordsCount} Words • {readTimeEstimate}</span>
              <span>{content.length} characters</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* ──────────────── FULL ARTICLE READER DRAWER ──────────────── */}
      <Modal
        isOpen={!!readingArticle}
        onClose={() => setReadingArticle(null)}
        title="Article Reader"
        subtitle={readingArticle ? `${readingArticle.category} • ${readingArticle.date}` : ''}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              icon={<RiEditLine />}
              onClick={() => {
                const a = readingArticle;
                setReadingArticle(null);
                openEditArticle(a);
              }}
            >
              Edit Article
            </Button>
            <Button variant="primary" onClick={() => setReadingArticle(null)}>
              Close
            </Button>
          </>
        }
      >
        {readingArticle && (
          <div className="space-y-6 font-poppins">
            {/* Header Hero with Full Banner Image if present */}
            {readingArticle.bannerUrl && (
              <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                <img
                  src={readingArticle.bannerUrl}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-5 bg-gradient-to-r from-gold-50 via-amber-50/30 to-white rounded-2xl border border-gold-200/80 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-0.5 rounded-full border shadow-2xs bg-white text-slate-700 border-slate-200">
                  {readingArticle.category}
                </span>
                <span className="text-xs text-slate-400">• {readingArticle.readTime || '3 min read'}</span>
                <span className="text-xs text-slate-400">• {readingArticle.date}</span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 font-poppins leading-tight">
                {readingArticle.title}
              </h1>

              {readingArticle.subtitle && (
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {readingArticle.subtitle}
                </p>
              )}

              <div className="flex items-center gap-3 pt-3 border-t border-gold-200/60">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-xs ring-2 ring-gold-200 shadow-2xs">
                  {readingArticle.author?.avatar || 'SA'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{readingArticle.author?.name || 'Super Admin'}</p>
                  <p className="text-[11px] text-slate-400">{readingArticle.author?.role || 'Platform Contributor'}</p>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs text-slate-700 leading-relaxed font-poppins">
              {(readingArticle.content || readingArticle.excerpt).split('\n\n').map((block, idx) => {
                if (block.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-sm font-bold text-slate-900 font-poppins border-b border-slate-100 pb-1.5 mt-3 text-gold-700">
                      {block.replace('## ', '')}
                    </h2>
                  );
                }
                if (block.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xs font-semibold text-slate-800 font-poppins mt-2">
                      {block.replace('### ', '')}
                    </h3>
                  );
                }
                if (block.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="p-3 bg-gold-50/70 border-l-4 border-gold-400 rounded-r-xl text-slate-700 italic my-2 text-xs">
                      {block.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (block.startsWith('- ')) {
                  const items = block.split('\n- ');
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                      {items.map((it, iIdx) => (
                        <li key={iIdx}>{it.replace(/^- /, '')}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-slate-600 font-normal leading-relaxed">
                    {block}
                  </p>
                );
              })}
            </div>

            {/* Tags Pill Row */}
            {readingArticle.tags && readingArticle.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Tagged with:</span>
                {readingArticle.tags.map((tg, i) => (
                  <span key={i} className="text-xs font-medium text-gold-700 bg-gold-50 border border-gold-200/80 px-2.5 py-0.5 rounded-lg">
                    #{tg}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ──────────────── Delete Article Confirmation Modal ──────────────── */}
      <Modal
        isOpen={!!articleToDelete}
        onClose={() => setArticleToDelete(null)}
        title="Confirm Article Deletion"
        subtitle="Permanent Removal"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setArticleToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleDeleteArticle}>
              Confirm Delete
            </Button>
          </>
        }
      >
        {articleToDelete && (
          <div className="space-y-4 text-center py-2 font-poppins">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <RiAlertLine size={28} />
            </div>

            <div>
              <h4 className="text-base font-semibold text-slate-800 font-poppins">
                Delete Article?
              </h4>
              <p className="text-sm text-slate-500 mt-1 font-normal font-poppins">
                Article <strong className="text-slate-800">{articleToDelete.title}</strong> will be permanently deleted from the platform.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
