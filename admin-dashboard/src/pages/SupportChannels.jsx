import React, { useState, useEffect, useCallback } from 'react';
import {
  RiCustomerService2Line, RiWhatsappLine, RiTelegramLine, RiMailSendLine,
  RiPhoneLine, RiDiscordLine, RiTwitterXLine, RiYoutubeLine, RiInstagramLine,
  RiChat1Line, RiExternalLinkLine, RiEditLine, RiDeleteBinLine, RiAddLine,
  RiCheckLine, RiShieldCheckLine, RiTimeLine, RiGlobalLine, RiSearchLine,
  RiFileCopyLine, RiHeadphoneLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel
} from '../api/supportApi';

export default function SupportChannels() {
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'WhatsApp',
    title: '',
    handle: '',
    url: '',
    department: '24/7 VIP Support',
    hours: '24/7 Live Coverage',
    category: 'Instant Chat',
    status: 'Active',
    stats: 'Avg. Reply < 2 mins',
  });

  // Delete State
  const [deletingChannel, setDeletingChannel] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchChannels = useCallback(async () => {
    try {
      const res = await getChannels();
      if (res?.success && Array.isArray(res.channels)) {
        setChannels(res.channels);
      } else {
        setChannels([]);
      }
    } catch (err) {
      console.warn('Error fetching support channels:', err.message);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setFormData({
      platform: 'WhatsApp',
      title: '',
      handle: '',
      url: '',
      department: '24/7 VIP Escrow Support',
      hours: '24/7 Live Coverage',
      category: 'Instant Chat',
      status: 'Active',
      stats: 'Avg. Reply < 2 mins',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (chan) => {
    setEditingChannel(chan);
    setFormData({ ...chan });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    try {
      if (editingChannel) {
        await updateChannel(editingChannel._id || editingChannel.id, formData);
      } else {
        await createChannel(formData);
      }
    } catch (err) {
      console.warn('API channels offline:', err.message);
    }

    let updated;
    if (editingChannel) {
      updated = channels.map(c => c.id === editingChannel.id ? { ...formData, id: editingChannel.id } : c);
    } else {
      const newChan = {
        ...formData,
        id: `chan-${Date.now()}`,
        icon: formData.platform.toLowerCase().replace(/[^a-z0-9]/g, '')
      };
      updated = [newChan, ...channels];
    }
    setChannels(updated);
    localStorage.setItem('horizon_support_channels', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-support-channels-change', { detail: updated }));
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingChannel) return;

    try {
      if (deletingChannel._id || deletingChannel.id) {
        await deleteChannel(deletingChannel._id || deletingChannel.id);
      }
    } catch (err) {
      console.warn('API delete channel offline:', err.message);
    }

    const updated = channels.filter(c => c.id !== deletingChannel.id && c._id !== deletingChannel._id);
    setChannels(updated);
    localStorage.setItem('horizon_support_channels', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('horizon-support-channels-change', { detail: updated }));
    setDeletingChannel(null);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return <RiWhatsappLine size={24} className="text-emerald-500" />;
      case 'telegram':
        return <RiTelegramLine size={24} className="text-sky-500" />;
      case 'email':
        return <RiMailSendLine size={24} className="text-gold-600" />;
      case 'phone':
        return <RiPhoneLine size={24} className="text-blue-600" />;
      case 'discord':
        return <RiDiscordLine size={24} className="text-indigo-500" />;
      case 'twitter / x':
      case 'twitter':
        return <RiTwitterXLine size={24} className="text-slate-800" />;
      case 'youtube':
        return <RiYoutubeLine size={24} className="text-red-500" />;
      case 'instagram':
        return <RiInstagramLine size={24} className="text-pink-500" />;
      default:
        return <RiChat1Line size={24} className="text-gold-600" />;
    }
  };

  const filteredChannels = channels.filter(c => {
    const matchesSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.handle.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' ||
      (categoryFilter === 'chat' && (c.category === 'Instant Chat' || c.category === 'Telegram')) ||
      (categoryFilter === 'email' && c.category === 'Email Desk') ||
      (categoryFilter === 'phone' && c.category === 'Telephone') ||
      (categoryFilter === 'social' && (c.category === 'Community' || c.category === 'Social Media'));

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6 font-poppins">
        <div className="skeleton w-56 h-8 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8 font-poppins">
      {/* Header */}
      <PageHeader
        title="Official Support Channels & Links"
        subtitle="Manage 24/7 VIP WhatsApp desk, Telegram bots, official channels, compliance emails & telephone hotlines"
        badge="Live Channels"
        actions={
          <Button
            variant="primary"
            icon={<RiAddLine />}
            onClick={handleOpenAdd}
          >
            Add Support Channel
          </Button>
        }
      />

      {/* ──────────────── ROLLING ODOMETER STAT CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Support Desks"
          numericValue={channels.filter(c => c.status === 'Active').length}
          prefix=""
          suffix=" Desks"
          decimals={0}
          change="+2 Live"
          positive={true}
          icon="wallet"
        />
        <KPICard
          title="24/7 Live Chat Coverage"
          numericValue={4}
          prefix=""
          suffix=" Channels"
          decimals={0}
          change="Instant Dispatch"
          positive={true}
          icon="users"
        />
        <KPICard
          title="Avg. Response Speed"
          numericValue={2}
          prefix="< "
          suffix=" Mins"
          decimals={0}
          change="⚡ High-Speed"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Global Community Reach"
          numericValue={48500}
          prefix=""
          suffix=" Members"
          decimals={0}
          change="+14.5%"
          positive={true}
          icon="money"
        />
      </div>

      {/* ──────────────── CATEGORY FILTER TABS & SEARCH ──────────────── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <SearchBar
            placeholder="Search channels by name, handle, phone number, or department..."
            value={search}
            onChange={setSearch}
            className="flex-1 w-full"
          />

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            Showing {filteredChannels.length} Official Channels
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'all', label: 'All Channels', count: channels.length },
            { id: 'chat', label: 'Instant Chat & Telegram', count: channels.filter(c => c.category === 'Instant Chat' || c.category === 'Telegram').length },
            { id: 'email', label: 'Email Desks', count: channels.filter(c => c.category === 'Email Desk').length },
            { id: 'phone', label: 'Telephone Hotlines', count: channels.filter(c => c.category === 'Telephone').length },
            { id: 'social', label: 'Community & Social', count: channels.filter(c => c.category === 'Community' || c.category === 'Social Media').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                categoryFilter === tab.id
                  ? 'bg-gold-400 text-slate-900 font-semibold shadow-gold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] bg-white text-slate-800 font-bold border border-slate-200 shadow-2xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ──────────────── CHANNELS GRID (PURE WHITE & GOLD LIGHT THEME) ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((c, i) => (
          <div
            key={c.id}
            className="card p-5 space-y-4 hover:border-gold-300 hover:shadow-md transition-all animate-fade-in flex flex-col justify-between"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="space-y-3">
              {/* Header: Platform Icon + Category Tag + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shadow-2xs">
                    {getPlatformIcon(c.platform)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {c.platform}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 leading-tight font-poppins">
                      {c.title}
                    </h3>
                  </div>
                </div>

                <Badge variant={c.status === 'Active' ? 'success' : 'warning'} size="sm">
                  {c.status}
                </Badge>
              </div>

              {/* Department & Handle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">Department:</span>
                  <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[170px]">{c.department}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                  <span className="text-[11px] text-slate-500 font-medium">Account / Handle:</span>
                  <span className="text-[11px] font-mono font-bold text-gold-700 truncate max-w-[170px]">{c.handle}</span>
                </div>
              </div>

              {/* Operating Hours & Stats Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="inline-flex items-center gap-1">
                  <RiTimeLine size={13} className="text-gold-600" />
                  {c.hours}
                </span>
                <span className="font-semibold text-slate-700 bg-gold-50/80 border border-gold-200 px-2 py-0.5 rounded-md">
                  {c.stats}
                </span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold shadow-gold transition-all active:scale-95"
              >
                <RiExternalLinkLine size={14} />
                <span>Open / Test Channel</span>
              </a>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => copyToClipboard(c.url, c.id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-500 hover:text-gold-800 transition-colors border border-slate-200 shadow-2xs"
                  title="Copy direct link"
                >
                  {copiedId === c.id ? <RiCheckLine size={14} className="text-emerald-600" /> : <RiFileCopyLine size={14} />}
                </button>

                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-gold-50 text-slate-500 hover:text-gold-800 transition-colors border border-slate-200 shadow-2xs"
                  title="Edit Channel"
                >
                  <RiEditLine size={14} />
                </button>

                <button
                  onClick={() => setDeletingChannel(c)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors border border-slate-200 shadow-2xs"
                  title="Delete Channel"
                >
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredChannels.length === 0 && (
          <div className="col-span-full card p-12 text-center text-xs text-slate-400 font-poppins">
            No official support channels found. Click "Add Official Channel" to configure your support desk.
          </div>
        )}
      </div>

      {/* ──────────────── ADD / EDIT CHANNEL SLIDE-OVER DRAWER ──────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChannel ? `Edit Channel: ${editingChannel.title}` : 'Add Official Support Channel'}
        subtitle="Configure direct WhatsApp link, Telegram bot, email desk, or social community"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleSave}>
              {editingChannel ? 'Update Channel' : 'Save Channel'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 font-poppins">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Platform Type *
              </label>
              <select
                value={formData.platform}
                onChange={e => {
                  const plat = e.target.value;
                  let cat = 'Instant Chat';
                  if (plat === 'Telegram') cat = 'Telegram';
                  else if (plat === 'Email') cat = 'Email Desk';
                  else if (plat === 'Phone') cat = 'Telephone';
                  else if (['Discord', 'Twitter / X', 'YouTube', 'Instagram'].includes(plat)) cat = 'Social Media';

                  setFormData({ ...formData, platform: plat, category: cat });
                }}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="Email">Official Email</option>
                <option value="Phone">Telephone Hotline</option>
                <option value="Discord">Discord Community</option>
                <option value="Twitter / X">Twitter / X</option>
                <option value="YouTube">YouTube</option>
                <option value="Instagram">Instagram</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              >
                <option value="Active">Active / Online</option>
                <option value="Offline">Offline</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Channel Title *
            </label>
            <input
              type="text"
              placeholder="e.g. WhatsApp Official VIP Helpdesk"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Handle / Account *
              </label>
              <input
                type="text"
                placeholder="e.g. +1 (800) 249-9201 or @HorizonBot"
                value={formData.handle}
                onChange={e => setFormData({ ...formData, handle: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. 24/7 VIP Escrow Support"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Direct Action URL / Link *
            </label>
            <input
              type="text"
              placeholder="e.g. https://wa.me/18002499201 or mailto:support@..."
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                placeholder="e.g. 24/7 Live Coverage"
                value={formData.hours}
                onChange={e => setFormData({ ...formData, hours: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Performance / Community Stats
              </label>
              <input
                type="text"
                placeholder="e.g. Avg. Reply < 2 mins"
                value={formData.stats}
                onChange={e => setFormData({ ...formData, stats: e.target.value })}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* ──────────────── DELETE CONFIRMATION MODAL ──────────────── */}
      <Modal
        isOpen={!!deletingChannel}
        onClose={() => setDeletingChannel(null)}
        title="Delete Support Channel"
        subtitle="This action will remove the official link from public investor contact desks."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingChannel(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleDelete}>
              Confirm Delete
            </Button>
          </>
        }
      >
        {deletingChannel && (
          <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200 space-y-2 text-xs font-poppins">
            <p className="font-semibold text-red-900">Are you sure you want to delete this support channel?</p>
            <p className="text-red-700">{deletingChannel.title} ({deletingChannel.handle})</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
