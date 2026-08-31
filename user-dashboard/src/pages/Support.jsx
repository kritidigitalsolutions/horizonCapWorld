import React, { useState, useEffect, useRef } from 'react';
import { supportCategories } from '../data/userMockData';
import {
  getSupportChannels,
  getMyTickets,
  createSupportTicket,
  replyToTicket
} from '../api/supportApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';
import {
  RiSendPlaneLine, RiCustomerService2Line, RiWhatsappLine, RiTelegramLine, RiMailLine,
  RiPhoneLine, RiDiscordLine, RiExternalLinkLine, RiFileCopyLine, RiCheckLine,
  RiTimeLine, RiShieldCheckLine, RiTicketLine, RiHistoryLine, RiAddLine,
  RiInformationLine, RiCheckboxCircleFill, RiSearchLine, RiGlobeLine,
  RiAttachment2, RiUploadCloud2Line, RiDeleteBin7Line, RiImageLine, RiFileTextLine,
  RiEyeLine, RiAlertLine
} from 'react-icons/ri';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

// Default Official Channels matching Super Admin Mock Data
const defaultOfficialChannels = [
  {
    id: 'chan-1',
    category: 'Instant Chat',
    platform: 'WhatsApp',
    title: 'WhatsApp Official VIP Helpdesk',
    handle: '+1 (800) 249-9201',
    url: 'https://wa.me/18002499201',
    department: '24/7 VIP Escrow & Deposit Support',
    hours: '24/7 Live Coverage',
    status: 'Active',
    stats: 'Avg. Reply < 2 mins'
  },
  {
    id: 'chan-2',
    category: 'Instant Chat',
    platform: 'WhatsApp',
    title: 'VIP Investors Community Group',
    handle: 'Horizon VIP Investors Circle',
    url: 'https://chat.whatsapp.com/HorizonVIPCommunity',
    department: 'Official Daily Updates & Announcements',
    hours: '24/7 Live Community',
    status: 'Active',
    stats: '12,400 Members'
  },
  {
    id: 'chan-3',
    category: 'Telegram',
    platform: 'Telegram',
    title: 'Telegram 24/7 Support Bot',
    handle: '@HorizonSupportBot',
    url: 'https://t.me/HorizonSupportBot',
    department: 'Automated Account & Live Agent Routing',
    hours: '24/7 Automated + Live Agents',
    status: 'Active',
    stats: 'Instant AI + Agent Desk'
  },
  {
    id: 'chan-4',
    category: 'Telegram',
    platform: 'Telegram',
    title: 'Official Announcements Channel',
    handle: '@HorizonCapitalOfficial',
    url: 'https://t.me/HorizonCapitalOfficial',
    department: 'Corporate News, Yield Reports & Media',
    hours: 'Broadcast Channel',
    status: 'Active',
    stats: '48,500 Subscribers'
  },
  {
    id: 'chan-5',
    category: 'Email Desk',
    platform: 'Email',
    title: 'General Support Helpdesk',
    handle: 'support@horizonofcapital.com',
    url: 'mailto:support@horizonofcapital.com',
    department: 'Ticket Resolution & Technical Assistance',
    hours: '24/7 Monitoring (Reply < 30m)',
    status: 'Active',
    stats: '100% Response Rate'
  },
  {
    id: 'chan-6',
    category: 'Email Desk',
    platform: 'Email',
    title: 'Compliance & Institutional Escrow',
    handle: 'escrow@horizonofcapital.com',
    url: 'mailto:escrow@horizonofcapital.com',
    department: 'Institutional SWIFT Wires & Escrow Verification',
    hours: 'Mon-Fri 8:00 AM - 8:00 PM EST',
    status: 'Active',
    stats: 'Institutional Desk'
  },
  {
    id: 'chan-7',
    category: 'Telephone',
    platform: 'Phone',
    title: 'Global Toll-Free Hotline',
    handle: '+1 (800) 249-9201',
    url: 'tel:+18002499201',
    department: 'Direct Priority Voice Desk (USA / UK / Global)',
    hours: 'Mon-Fri 9:00 AM - 6:00 PM EST',
    status: 'Active',
    stats: 'Toll-Free Worldwide'
  },
  {
    id: 'chan-8',
    category: 'Community',
    platform: 'Discord',
    title: 'Discord VIP Community Hub',
    handle: 'discord.gg/horizoncap',
    url: 'https://discord.gg/horizoncap',
    department: 'Global Trading Strategies & Networking',
    hours: '24/7 Community Chats',
    status: 'Active',
    stats: '8,900 Online'
  },
];

export default function Support() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'create_ticket' | 'my_tickets'

  const [channels, setChannels] = useState(defaultOfficialChannels);
  const [channelCategory, setChannelCategory] = useState('all');
  const [channelSearch, setChannelSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Ticket Form State
  const [form, setForm] = useState({ category: 'Investment', priority: 'Normal', subject: '', message: '' });
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, type, previewUrl }
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const fileInputRef = useRef(null);

  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSupportData = async () => {
    try {
      const [chanRes, tickRes] = await Promise.allSettled([
        getSupportChannels(),
        getMyTickets(),
      ]);

      if (chanRes.status === 'fulfilled' && chanRes.value?.success && Array.isArray(chanRes.value.channels) && chanRes.value.channels.length > 0) {
        setChannels(chanRes.value.channels);
      }

      if (tickRes.status === 'fulfilled' && tickRes.value?.success && Array.isArray(tickRes.value.tickets)) {
        const formatted = tickRes.value.tickets.map(t => ({
          _id: t._id,
          id: t.ticketId || t._id,
          category: t.category || 'General Support',
          priority: t.priority || 'Medium',
          subject: t.subject || 'Support Request',
          date: t.createdAt ? new Date(t.createdAt).toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Just now',
          status: t.status || 'Open',
          message: t.messages?.[0]?.text || '',
          messages: t.messages || [],
          reply: t.messages?.length > 1 ? t.messages[t.messages.length - 1].text : 'Ticket logged with support queue. Assigned to an executive agent.',
          attachment: t.messages?.[0]?.attachments?.[0] ? { previewUrl: t.messages[0].attachments[0], name: 'Attachment' } : null,
        }));
        setMyTickets(formatted);
      }
    } catch (err) {
      console.warn('Using default support data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  // Sync Support Channels with Super Admin
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setChannels(e.detail);
      } else {
        const saved = localStorage.getItem('horizon_support_channels');
        if (saved) {
          try {
            setChannels(JSON.parse(saved));
          } catch (err) {}
        }
      }
    };
    window.addEventListener('horizon-support-channels-change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('horizon-support-channels-change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setAttachedFile({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          type: file.type,
          isImage: file.type.startsWith('image/'),
          previewUrl: uploadEvent.target.result,
          cloudinaryUrl: null,
        });
      };
      reader.readAsDataURL(file);

      try {
        const uploadRes = await uploadFileToCloudinary(file, {
          folder: 'horizoncap/tickets',
        });
        if (uploadRes?.secure_url) {
          setAttachedFile(prev => prev ? { ...prev, cloudinaryUrl: uploadRes.secure_url } : null);
        }
      } catch (err) {
        console.warn('Ticket attachment direct upload fallback:', err.message);
      }
    }
  };

  const handleRemoveFile = () => {
    if (attachedFile?.cloudinaryUrl && attachedFile.cloudinaryUrl.includes('cloudinary.com')) {
      deleteFileFromCloudinary(attachedFile.cloudinaryUrl).catch(() => null);
    }
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPlatformIcon = (platform) => {
    switch ((platform || '').toLowerCase()) {
      case 'whatsapp':
        return <RiWhatsappLine size={24} className="text-emerald-500" />;
      case 'telegram':
        return <RiTelegramLine size={24} className="text-blue-500" />;
      case 'email':
        return <RiMailLine size={24} className="text-amber-500" />;
      case 'phone':
        return <RiPhoneLine size={24} className="text-indigo-500" />;
      case 'discord':
        return <RiDiscordLine size={24} className="text-purple-500" />;
      default:
        return <RiCustomerService2Line size={24} className="text-gold-600" />;
    }
  };

  const filteredChannels = channels.filter(c => {
    const matchCategory = channelCategory === 'all' || c.category === channelCategory || c.platform.toLowerCase() === channelCategory.toLowerCase();
    const q = channelSearch.trim().toLowerCase();
    const matchSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      c.handle.toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTicketError('');
    if (!form.subject || !form.message) {
      setTicketError('Subject and message are required.');
      return;
    }

    setTicketSubmitting(true);
    try {
      const attachmentUrl = attachedFile?.cloudinaryUrl || attachedFile?.previewUrl;
      const payload = {
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        message: form.message.trim(),
        attachments: attachmentUrl ? [attachmentUrl] : [],
      };

      const res = await createSupportTicket(payload);
      if (res?.success && res.ticket) {
        const created = {
          _id: res.ticket._id,
          id: res.ticket.ticketId || res.ticket._id,
          category: res.ticket.category,
          priority: res.ticket.priority,
          subject: res.ticket.subject,
          message: form.message,
          messages: res.ticket.messages || [],
          date: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          status: res.ticket.status || 'Open',
          reply: 'Ticket logged with support queue. Assigned to an executive agent.',
          attachment: attachedFile,
        };

        setMyTickets(prev => [created, ...prev]);
        setSubmittedSuccess(true);
        setTimeout(() => {
          setSubmittedSuccess(false);
          setForm({ category: 'Investment', priority: 'Normal', subject: '', message: '' });
          setAttachedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setActiveTab('my_tickets');
        }, 1800);
      } else {
        setTicketError(res?.message || 'Failed to submit ticket.');
      }
    } catch (err) {
      setTicketError(err.response?.data?.message || err.message || 'Support ticket submission failed.');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const channelCategories = [
    { key: 'all', label: 'All Channels' },
    { key: 'Instant Chat', label: 'WhatsApp VIP' },
    { key: 'Telegram', label: 'Telegram Desk' },
    { key: 'Email Desk', label: 'Email Helpdesk' },
    { key: 'Telephone', label: 'Phone Hotline' },
    { key: 'Community', label: 'Community Hub' },
  ];

  const mainTabs = [
    { key: 'channels', label: 'Official Support Channels', icon: RiCustomerService2Line, count: channels.length },
    { key: 'create_ticket', label: 'Submit Support Ticket', icon: RiAddLine },
    { key: 'my_tickets', label: 'My Tickets & History', icon: RiTicketLine, count: myTickets.length },
  ];

  return (
    <div className="page-enter space-y-6 pb-12 font-poppins">
      {/* ──────── PAGE HEADER ──────── */}
      <PageHeader
        title="Investor Support Desk"
        subtitle="24/7 dedicated assistance, live escalation tickets, and official verified channels"
        badge="24/7 Support"
      />

      {/* ──────── TOP LUXURY TAB BUTTONS (MATCHING SUPER ADMIN / PROFILE DESIGN) ──────── */}
      <div className="card p-2">
        <div className="flex gap-2 overflow-x-auto font-poppins">
          {mainTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gold-400 text-slate-950 font-bold shadow-gold'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-slate-950 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ──────────────── TAB 1: ALL OFFICIAL SUPPORT CHANNELS (SUPER ADMIN DIRECT SYNC) ──────────────── */}
      {activeTab === 'channels' && (
        <div className="space-y-4 font-poppins">
          {/* Filter & Search Header Card */}
          <div className="card p-5 space-y-4 border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 font-poppins">
                {channelCategories.map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setChannelCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      channelCategory === cat.key
                        ? 'bg-gold-400 text-slate-950 font-bold shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <RiSearchLine size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={channelSearch}
                  onChange={e => setChannelSearch(e.target.value)}
                  placeholder="Search channels, handles..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Channels Grid (2-Columns on large screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChannels.map(ch => (
              <div
                key={ch.id}
                className="card p-5 border border-slate-200 hover:border-gold-300 bg-white hover:bg-gold-50/20 transition-all shadow-sm space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {getPlatformIcon(ch.platform)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                        {ch.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-normal mt-0.5 truncate">
                        {ch.department}
                      </p>
                    </div>
                  </div>

                  <Badge variant={ch.status === 'Active' ? 'success' : 'default'} size="sm">
                    {ch.hours || '24/7 Live'}
                  </Badge>
                </div>

                {/* Handle, Stats & Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="font-mono text-slate-800 font-bold block truncate max-w-[210px]">
                      {ch.handle}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">{ch.stats || 'Active Desk'}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(ch.handle, ch.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Copy handle"
                    >
                      <RiFileCopyLine size={14} />
                      <span>{copiedId === ch.id ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <a
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-gold transition-colors"
                    >
                      <span>Connect</span>
                      <RiExternalLinkLine size={14} />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {filteredChannels.length === 0 && (
              <div className="col-span-full card p-12 text-center text-slate-400 text-sm font-medium">
                No official support channels found matching your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: SUBMIT A SUPPORT TICKET (WITH MEDIA ATTACHMENT) ──────────────── */}
      {activeTab === 'create_ticket' && (
        <div className="card p-6 sm:p-8 max-w-3xl mx-auto border border-slate-200 shadow-sm font-poppins space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-50 border border-gold-200 flex items-center justify-center flex-shrink-0 text-gold-700 shadow-2xs">
              <RiCustomerService2Line size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Submit an Escalation Support Ticket</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Our executive desk responds to high-priority investor tickets in under 4 hours
              </p>
            </div>
          </div>

          {ticketError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-slide-up">
              <RiAlertLine size={18} className="text-rose-600 flex-shrink-0" />
              <span>{ticketError}</span>
            </div>
          )}

          {submittedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-slide-up">
              <RiCheckboxCircleFill size={18} className="text-emerald-600 flex-shrink-0" />
              <span>Ticket logged successfully! An instant confirmation has been dispatched to your email.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-poppins">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Category *
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                >
                  {supportCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Level *
                </label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                >
                  <option value="Normal">Normal Priority</option>
                  <option value="High">High Priority (Urgent)</option>
                  <option value="Urgent VIP">Urgent VIP Priority (Instant Escalation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject / Summary *
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Deposit confirmation verification for Hash #0x..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Message & Requirements *
              </label>
              <textarea
                rows={5}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Please describe your issue in detail. Include transaction IDs, wallet addresses, or sponsor details..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-gold-400 shadow-2xs resize-none"
                required
              />
            </div>

            {/* ──────── MEDIA FILE / SCREENSHOT ATTACHMENT BOX ──────── */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                Attach Media / Proof Screenshot (Optional)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf,.txt"
                className="hidden"
              />

              {!attachedFile ? (
                /* Upload Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-200 hover:border-gold-400 rounded-2xl bg-slate-50/50 hover:bg-gold-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-gold-600 flex items-center justify-center shadow-2xs">
                    <RiUploadCloud2Line size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload screenshot, payment slip, or document
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      PNG, JPG, PDF up to 10MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Attached File Preview Card */
                <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-300 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-3 min-w-0">
                    {attachedFile.isImage ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gold-300 flex-shrink-0 bg-white">
                        <img src={attachedFile.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white border border-gold-300 flex items-center justify-center flex-shrink-0 text-gold-700">
                        <RiFileTextLine size={22} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate max-w-xs">{attachedFile.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{attachedFile.size} • Attached File</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <RiDeleteBin7Line size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={ticketSubmitting}
                className="w-full btn btn-primary py-3.5 text-xs font-bold shadow-gold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RiSendPlaneLine size={16} />
                <span>{ticketSubmitting ? 'Logging Ticket...' : 'Submit Support Ticket'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ──────────────── TAB 3: MY TICKETS & HISTORY ──────────────── */}
      {activeTab === 'my_tickets' && (
        <div className="card p-6 sm:p-7 border border-slate-200 shadow-sm font-poppins space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">My Support Tickets & Resolution History</h3>
              <p className="text-xs text-slate-400">Track real-time status and official responses from our executive support desk</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create_ticket')}
              className="btn btn-primary text-xs px-3.5 py-1.5 rounded-xl shadow-gold flex items-center gap-1.5 cursor-pointer"
            >
              <RiAddLine size={14} />
              <span>New Ticket</span>
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {myTickets.map(t => (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-gold-800 bg-gold-100/80 px-2.5 py-0.5 rounded-lg border border-gold-300 text-xs">
                      {t.id}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{t.subject}</h4>
                  </div>
                  <Badge variant={t.status === 'Resolved' ? 'success' : t.status === 'In Progress' ? 'warning' : 'default'} size="sm">
                    {t.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>Category: <strong className="text-slate-700">{t.category}</strong></span>
                  <span>•</span>
                  <span>Priority: <strong className="text-slate-700">{t.priority}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono"><RiTimeLine size={13} /> {t.date}</span>
                </div>

                {/* User Message */}
                <div className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-400 block uppercase text-[10px] tracking-wider mb-1">Your Query:</strong>
                  {t.message || t.subject}
                </div>

                {/* Attachment if present */}
                {t.attachment && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <RiImageLine className="text-gold-600" size={18} />
                      <span className="font-semibold text-slate-800 truncate">{t.attachment.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({t.attachment.size})</span>
                    </div>
                    {t.attachment.previewUrl && (
                      <a
                        href={t.attachment.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1 text-[11px]"
                      >
                        <RiEyeLine size={14} /> View File
                      </a>
                    )}
                  </div>
                )}

                {/* Desk Resolution Note */}
                <div className="p-3.5 bg-gold-50/50 rounded-xl border border-gold-200 text-xs text-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-gold-900 font-bold uppercase tracking-wider text-[10px]">
                    <RiShieldCheckLine size={14} className="text-gold-600" />
                    <span>Official Desk Response</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">{t.reply}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
