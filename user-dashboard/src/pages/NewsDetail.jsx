import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { newsArticles as initialArticles } from '../data/userMockData';
import { getNewsArticle, getNews } from '../api/newsApi';
import {
  RiArrowLeftLine, RiCalendarLine, RiTimeLine, RiEyeLine, RiShareLine,
  RiFileCopyLine, RiCheckLine, RiPriceTag3Line, RiShieldCheckLine,
  RiLightbulbLine, RiNewspaperLine, RiTwitterXLine, RiTelegramLine,
  RiWhatsappLine, RiBookmarkLine, RiUser3Line, RiArrowRightLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const [articleRes, listRes] = await Promise.allSettled([
          getNewsArticle(id),
          getNews({ limit: 4 }),
        ]);

        if (articleRes.status === 'fulfilled' && articleRes.value?.success && articleRes.value.news) {
          const art = articleRes.value.news;
          setArticle({
            id: art._id || art.id,
            title: art.title,
            subtitle: art.subtitle || '',
            content: art.content || '',
            category: art.category || 'Renewable Energy',
            date: art.createdAt ? art.createdAt.split('T')[0] : '2026-08-20',
            authorName: art.author?.name || art.authorName || 'Horizon Editorial Team',
            readTime: art.readTime || '3 min read',
            image: art.image || '',
            tags: art.tags || [],
          });
        } else {
          const fallback = initialArticles.find(a => String(a.id) === String(id)) || initialArticles[0];
          setArticle(fallback);
        }

        if (listRes.status === 'fulfilled' && listRes.value?.success && Array.isArray(listRes.value.news)) {
          const rel = listRes.value.news
            .filter(a => String(a._id) !== String(id) && String(a.id) !== String(id))
            .slice(0, 3)
            .map(a => ({
              id: a._id || a.id,
              title: a.title,
              subtitle: a.subtitle || '',
              content: a.content || '',
              category: a.category || 'Renewable Energy',
              date: a.createdAt ? a.createdAt.split('T')[0] : '2026-08-20',
              image: a.image || '',
            }));
          setRelatedArticles(rel);
        } else {
          const relFallback = initialArticles.filter(a => String(a.id) !== String(id)).slice(0, 3);
          setRelatedArticles(relFallback);
        }
      } catch (err) {
        console.warn('Using fallback news detail:', err.message);
        const fallback = initialArticles.find(a => String(a.id) === String(id)) || initialArticles[0];
        setArticle(fallback);
        setRelatedArticles(initialArticles.filter(a => String(a.id) !== String(id)).slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!article) {
    return (
      <div className="card p-12 text-center space-y-4 font-poppins">
        <p className="text-slate-500 text-sm">Article not found or has been removed.</p>
        <Link to="/news" className="btn btn-primary text-xs px-4 py-2 font-bold inline-flex items-center gap-1">
          <RiArrowLeftLine size={14} /> Back to News & Media
        </Link>
      </div>
    );
  }

  // Parse markdown content into structured blocks
  const renderFormattedContent = (rawText) => {
    if (!rawText) return null;

    const paragraphs = rawText.split('\n\n');
    return paragraphs.map((block, index) => {
      const trimmed = block.trim();

      // Heading 2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl sm:text-2xl font-extrabold text-slate-900 font-poppins mt-6 mb-3 border-b border-slate-100 pb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      // Heading 3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-900 font-poppins mt-5 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-400" />
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={index} className="my-5 p-5 bg-gradient-to-r from-gold-50 via-amber-50/50 to-white rounded-2xl border-l-4 border-gold-400 text-slate-800 italic font-medium leading-relaxed shadow-xs">
            {trimmed.replace(/^>\s*/, '').replace(/"/g, '')}
          </blockquote>
        );
      }

      // Bullet List
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(i => i.startsWith('- '));
        return (
          <ul key={index} className="my-4 space-y-2 text-sm text-slate-700 font-poppins">
            {items.map((item, iIndex) => {
              const text = item.replace(/^- \*\*(.*?)\*\*:?/, '<strong>$1</strong>:');
              return (
                <li key={iIndex} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: text.replace('- ', '') }} />
                </li>
              );
            })}
          </ul>
        );
      }

      // Standard Paragraph
      return (
        <p key={index} className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal mb-4">
          {trimmed}
        </p>
      );
    });
  };

  const tags = Array.isArray(article.tags)
    ? article.tags
    : (article.tags || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);

  return (
    <div className="page-enter space-y-7 pb-20 font-poppins max-w-5xl mx-auto">
      {/* ──────── BREADCRUMB & BACK ACTION ──────── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/news"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gold-50 text-slate-700 hover:text-gold-900 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <RiArrowLeftLine size={16} />
          <span>Back to All Broadcasts</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
            title="Copy link to clipboard"
          >
            <RiFileCopyLine size={14} className="text-gold-600" />
            <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
          </button>
        </div>
      </div>

      {/* ──────── LUXURY ARTICLE CONTAINER ──────── */}
      <article className="card p-0 rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white">
        {/* Massive High-Res Image Banner */}
        <div className="relative h-[280px] sm:h-[400px] md:h-[480px] w-full overflow-hidden bg-slate-950">
          <img
            src={article.bannerUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Banner Overlays */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-gold-400 text-slate-950 text-xs font-black shadow-gold uppercase tracking-wider">
                {article.category || 'Official News'}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md text-slate-200 text-xs font-semibold border border-white/20">
                ✓ Verified Release
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1">
                <RiCalendarLine size={14} className="text-gold-400" />
                {article.publishDate || article.date || 'Aug 18, 2026'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <RiTimeLine size={14} />
                {article.readTime || '4 min read'}
              </span>
            </div>
          </div>
        </div>

        {/* Article Body Content Area */}
        <div className="p-6 sm:p-10 md:p-12 space-y-8">
          {/* Header Headlines */}
          <div className="space-y-4 border-b border-slate-100 pb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-poppins text-slate-900 leading-tight">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
                {article.subtitle}
              </p>
            )}

            {/* Author Profile Row */}
            <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gold-400 bg-gradient-to-tr from-gold-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-xs flex-shrink-0">
                  {(article.authorName || article.author?.name || 'Alexander Vance').charAt(0)}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    {article.authorName || article.author?.name || 'Alexander Vance'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {article.authorRole || article.author?.role || 'Chief Investment Officer'} • Horizon Capital Desk
                  </span>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-gold-100 text-slate-700 hover:text-gold-900 flex items-center justify-center transition-colors cursor-pointer"
                  title="Copy link"
                >
                  <RiFileCopyLine size={16} />
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors"
                  title="Share on WhatsApp"
                >
                  <RiWhatsappLine size={18} />
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors"
                  title="Share on Telegram"
                >
                  <RiTelegramLine size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Formatted Article Text */}
          <div className="prose prose-slate max-w-none text-slate-800">
            {renderFormattedContent(article.content)}
          </div>

          {/* Tags & Investor Notice Box */}
          <div className="pt-6 border-t border-slate-100 space-y-6">
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1">
                  <RiPriceTag3Line size={14} className="text-gold-600" /> Topics:
                </span>
                {tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl font-mono text-[11px] font-semibold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Official Investor Callout */}
            <div className="p-5 rounded-2xl bg-gold-50/70 border border-gold-300 flex items-start gap-4 text-xs font-poppins">
              <div className="w-10 h-10 rounded-xl bg-white border border-gold-300 flex items-center justify-center text-gold-700 flex-shrink-0 shadow-2xs">
                <RiLightbulbLine size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">Investor Platform Transparency Commitment</h4>
                <p className="text-slate-600 leading-relaxed font-normal">
                  All announcements, custody audits, and off-take reports published on this portal are cryptographically verified and backed by institutional third-party custodians.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ──────── RELATED PUBLICATIONS CAROUSEL / GRID ──────── */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-poppins">
            <RiNewspaperLine className="text-gold-600" size={20} /> Recommended & Related Broadcasts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map(rel => (
              <Link
                key={rel.id}
                to={`/news/${rel.id}`}
                className="card p-0 rounded-2xl overflow-hidden border border-slate-200 hover:border-gold-300 shadow-sm hover:shadow-gold transition-all duration-300 flex flex-col justify-between group bg-white"
              >
                <div className="relative h-36 w-full overflow-hidden bg-slate-950">
                  <img
                    src={rel.bannerUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 text-white backdrop-blur-sm text-[10px] font-bold">
                      {rel.category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {rel.publishDate || rel.date || 'Aug 2026'}
                    </span>
                    <h5 className="font-bold text-slate-900 text-xs line-clamp-2 mt-1 leading-snug group-hover:text-gold-700 transition-colors">
                      {rel.title}
                    </h5>
                  </div>

                  <span className="text-[11px] font-bold text-gold-700 flex items-center gap-1 pt-2 border-t border-slate-100">
                    <span>Read Article</span>
                    <RiArrowRightLine size={13} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
