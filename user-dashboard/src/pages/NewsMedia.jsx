import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getNews } from '../api/newsApi';
import {
  RiNewspaperLine, RiCalendarLine, RiTimeLine, RiEyeLine, RiArrowRightLine,
  RiSearchLine, RiShareLine, RiBookmarkLine, RiCompass3Line, RiGlobalLine,
  RiSparklingLine, RiPriceTag3Line, RiUser3Line, RiShieldCheckLine
} from 'react-icons/ri';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';

export default function NewsMedia() {
  const [articles, setArticles] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNewsList = useCallback(async () => {
    try {
      const res = await getNews({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });

      const rawList = res?.articles || res?.news || [];
      if (res?.success && Array.isArray(rawList)) {
        const formatted = rawList.map(art => ({
          id: art._id || art.id || art.customId,
          title: art.title,
          subtitle: art.subtitle || '',
          content: art.content || '',
          category: art.category || 'Company',
          date: art.createdAt ? art.createdAt.split('T')[0] : '2026-08-20',
          publishDate: art.date || (art.createdAt ? new Date(art.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'),
          authorName: typeof art.author === 'object' ? (art.author?.name || 'Super Admin') : (art.author || art.authorName || 'Super Admin'),
          authorRole: typeof art.author === 'object' ? (art.author?.role || 'Platform Editorial') : 'Platform Editorial',
          readTime: art.readTime || '3 min read',
          image: art.bannerUrl || art.image || '',
          bannerUrl: art.bannerUrl || art.image || '',
          tags: Array.isArray(art.tags) ? art.tags : (art.tags ? art.tags.split(',') : []),
        }));
        setArticles(formatted);
      } else {
        setArticles([]);
      }
    } catch (err) {
      console.warn('Error fetching news articles:', err.message);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchNewsList();
  }, [fetchNewsList]);

  // Sync news broadcasts with Super Admin publishing
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setArticles(e.detail);
      } else {
        fetchNewsList();
      }
    };
    window.addEventListener('horizon-news-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-news-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchNewsList]);

  const categories = [
    'all',
    'Renewable Energy',
    'Precious Metals',
    'Company',
    'Update',
    'Market'
  ];

  const filteredArticles = articles.filter(art => {
    const matchCategory = categoryFilter === 'all' || art.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      art.title.toLowerCase().includes(q) ||
      (art.subtitle || '').toLowerCase().includes(q) ||
      (art.category || '').toLowerCase().includes(q) ||
      (art.authorName || art.author?.name || '').toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  // Featured Hero Article (first published article)
  const featuredArticle = filteredArticles[0] || articles[0];
  const gridArticles = filteredArticles.length > 0 ? (categoryFilter === 'all' && !search ? filteredArticles.slice(1) : filteredArticles) : [];

  return (
    <div className="page-enter space-y-7 pb-16 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="News & Media Broadcasts"
        subtitle="Official platform announcements, infrastructure milestones, and global market off-take reports"
        badge="Official Media Desk"
      />

      {/* ──────── FILTER & SEARCH HUB ──────── */}
      <div className="card p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 font-poppins">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-gold-400 text-slate-950 font-extrabold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Broadcasts' : cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <RiSearchLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search news, topics, tags..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
          />
        </div>
      </div>

      {/* ──────── FEATURED HERO STORY (WHEN VIEWING ALL) ──────── */}
      {featuredArticle && categoryFilter === 'all' && !search && (
        <div className="card p-0 rounded-3xl overflow-hidden border-2 border-gold-300 shadow-gold bg-white hover:shadow-card-hover transition-all duration-300 group">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Large Banner Image */}
            <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[400px] overflow-hidden bg-slate-950">
              <img
                src={featuredArticle.bannerUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'}
                alt={featuredArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:hidden" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-gold-400 text-slate-950 text-xs font-black shadow-gold uppercase tracking-wider">
                  Featured Headline
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-900/80 text-white backdrop-blur-md text-xs font-bold border border-white/20">
                  {featuredArticle.category}
                </span>
              </div>
            </div>

            {/* Content Side */}
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-b from-gold-50/40 via-white to-white">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <RiCalendarLine size={14} className="text-gold-600" />
                    {featuredArticle.publishDate || featuredArticle.date || 'Aug 18, 2026'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <RiTimeLine size={14} />
                    {featuredArticle.readTime || '4 min read'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black font-poppins text-slate-900 leading-snug group-hover:text-gold-800 transition-colors">
                  {featuredArticle.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
                  {featuredArticle.subtitle || (featuredArticle.content || '').slice(0, 160) + '...'}
                </p>
              </div>

              {/* Author & CTA Row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gold-400 to-amber-500 flex items-center justify-center text-slate-950 font-black text-xs shadow-2xs">
                    {(featuredArticle.authorName || featuredArticle.author?.name || 'Admin').charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {featuredArticle.authorName || featuredArticle.author?.name || 'Alexander Vance'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {featuredArticle.authorRole || featuredArticle.author?.role || 'Chief Investment Officer'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/news/${featuredArticle.id}`}
                  className="btn btn-primary px-5 py-2.5 text-xs font-bold rounded-xl shadow-gold flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Read Article</span>
                  <RiArrowRightLine size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────── BROADCASTS GRID ──────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <RiNewspaperLine className="text-gold-600" size={20} /> Latest Platform Publications
          </h3>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {filteredArticles.length} Stories Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridArticles.map(article => (
            <Link
              key={article.id}
              to={`/news/${article.id}`}
              className="card p-0 rounded-3xl overflow-hidden border border-slate-200 hover:border-gold-300 shadow-sm hover:shadow-gold transition-all duration-300 flex flex-col justify-between group bg-white"
            >
              {/* Image Banner */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-950">
                <img
                  src={article.bannerUrl || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop'}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-900/80 text-white backdrop-blur-md text-[11px] font-bold border border-white/20 shadow-xs">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-mono">
                    <span className="font-semibold text-slate-700">
                      {article.publishDate || article.date || 'Aug 15, 2026'}
                    </span>
                    <span>•</span>
                    <span>{article.readTime || '4 min read'}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-gold-700 transition-colors line-clamp-2 font-poppins">
                    {article.title}
                  </h4>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {article.subtitle || (article.content || '').slice(0, 120) + '...'}
                  </p>
                </div>

                {/* Footer Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-gold-700 group-hover:text-gold-900">
                  <span className="flex items-center gap-1.5">
                    <RiUser3Line size={13} className="text-slate-400" />
                    <span className="text-slate-600 font-medium truncate max-w-[130px]">
                      {article.authorName || article.author?.name || 'Super Admin'}
                    </span>
                  </span>

                  <span className="flex items-center gap-1">
                    <span>Full Story</span>
                    <RiArrowRightLine size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredArticles.length === 0 && (
            <div className="col-span-full card p-12 text-center text-slate-400 text-sm font-medium">
              No platform news broadcasts found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
