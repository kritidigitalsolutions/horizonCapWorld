import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RiCustomerService2Line, RiTicketLine, RiChat1Line, RiCheckLine,
  RiTimeLine, RiAlertLine, RiSendPlaneFill, RiAttachment2,
  RiUserLine, RiSearchLine, RiFilter3Line, RiInformationLine,
  RiShieldCheckLine, RiFlashlightLine, RiCoinsLine, RiMoneyDollarCircleLine,
  RiGroupLine, RiEyeLine, RiAddLine, RiCloseLine, RiCheckDoubleLine,
  RiTrophyLine, RiDeleteBinLine, RiDownloadLine, RiFileTextLine, RiUpload2Line,
  RiMailLine, RiZoomInLine, RiPlayFill, RiFilePdfLine, RiFileExcelLine,
  RiFileWordLine, RiImageLine, RiVideoLine
} from 'react-icons/ri';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import KPICard from '../components/ui/KPICard';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Pagination from '../components/ui/Pagination';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import MediaViewerModal, { getMediaType } from '../components/ui/MediaViewerModal';
import {
  getSupportTickets,
  replyTicket,
  updateTicketStatus,
  deleteTicket
} from '../api/supportApi';
import { getAllUsers } from '../api/usersApi';
import { uploadFileToCloudinary, deleteFileFromCloudinary } from '../api/uploadApi';

export default function SupportTickets() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Thread Drawer State (Kinetoscope Style)
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true); // Default ON
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileUrl, setAttachedFileUrl] = useState(null);

  // Centered Media Lightbox Viewer State (Image, PDF, Video, Doc Popup)
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Delete Ticket State
  const [deletingTicket, setDeletingTicket] = useState(null);

  // New Ticket Drawer State
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newTicketUser, setNewTicketUser] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Deposit & Funding');
  const [newTicketPriority, setNewTicketPriority] = useState('High');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  const fileInputRef = useRef(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await getSupportTickets({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: search.trim() || undefined,
      });

      if (res?.success && Array.isArray(res.tickets)) {
        const formatted = res.tickets.map(t => ({
          _id: t._id,
          id: t.customId || t._id,
          customId: t.userCustomId || '',
          userName: t.userName || t.user?.name || 'Investor',
          userEmail: t.userEmail || t.user?.email || '',
          userPhone: t.userPhone || '',
          userRank: t.userRank || 'Starter',
          userAvatar: (t.userName || 'Investor').split(' ').map(n => n[0]).join(''),
          subject: t.subject,
          category: t.category || 'General Support',
          priority: t.priority || 'Medium',
          status: t.status || 'Open',
          createdAt: t.createdAt ? t.createdAt.split('T')[0] : 'Just now',
          lastActivity: t.lastUpdated || 'Just now',
          messages: Array.isArray(t.messages) ? t.messages.map(m => ({
            id: m._id || `msg-${Date.now()}`,
            sender: m.sender || 'user',
            senderName: m.senderName || 'Investor',
            time: m.time || 'Just now',
            text: m.text || '',
            attachments: m.attachments || []
          })) : []
        }));
        setTickets(formatted);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.warn('Error fetching support tickets:', err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets();
    getAllUsers({ limit: 100 }).then(res => {
      if (res?.success && Array.isArray(res.users)) {
        setUsersList(res.users);
        if (res.users.length > 0 && !newTicketUser) {
          setNewTicketUser(res.users[0]._id || res.users[0].customId || res.users[0].id);
        }
      }
    }).catch(err => {
      console.warn('Error fetching users list for support tickets:', err.message);
    });
  }, [fetchTickets]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter, categoryFilter]);

  // Send Reply Action
  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;

    const attachmentPayload = attachedFileUrl || attachedFile;
    const attachments = attachmentPayload ? [attachmentPayload] : [];

    try {
      if (activeTicket._id || activeTicket.id) {
        await replyTicket(activeTicket._id || activeTicket.id, {
          message: replyText.trim(),
          text: replyText.trim(),
          isInternal: isInternalNote,
          attachments,
        });
      }
    } catch (err) {
      console.warn('API reply ticket offline:', err.message);
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: isInternalNote ? 'internal' : 'admin',
      senderName: isInternalNote ? 'Internal Admin Note' : 'Senior Support Officer',
      time: 'Just now',
      text: replyText.trim(),
      attachments: attachments
    };

    const updatedTicket = {
      ...activeTicket,
      lastActivity: 'Just now',
      messages: [...(activeTicket.messages || []), newMsg],
      status: activeTicket.status === 'Open' && !isInternalNote ? 'In Progress' : activeTicket.status
    };

    setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTicket : t));
    setActiveTicket(updatedTicket);
    setReplyText('');
    setAttachedFile(null);
    setAttachedFileUrl(null);
    setIsInternalNote(false);
  };

  // Change Ticket Status
  const handleStatusChange = async (newStatus) => {
    if (!activeTicket) return;

    try {
      if (activeTicket._id || activeTicket.id) {
        await updateTicketStatus(activeTicket._id || activeTicket.id, newStatus);
      }
    } catch (err) {
      console.warn('API update ticket status offline:', err.message);
    }

    const updated = { ...activeTicket, status: newStatus };
    setTickets(tickets.map(t => t.id === activeTicket.id ? updated : t));
    setActiveTicket(updated);
  };

  // Delete Ticket Action
  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;

    try {
      if (deletingTicket._id || deletingTicket.id) {
        await deleteTicket(deletingTicket._id || deletingTicket.id);
      }
    } catch (err) {
      console.warn('API delete ticket offline:', err.message);
    }

    setTickets(tickets.filter(t => t.id !== deletingTicket.id && t._id !== deletingTicket._id));
    if (activeTicket && (activeTicket.id === deletingTicket.id || activeTicket._id === deletingTicket._id)) {
      setActiveTicket(null);
    }
    setDeletingTicket(null);
  };

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.userName.toLowerCase().includes(search.toLowerCase()) ||
      t.customId.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || t.priority.toLowerCase() === priorityFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'all' || t.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // KPI Calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Create New Ticket
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) return;

    const selectedUserObj = usersList.find(u => (u._id === newTicketUser || u.customId === newTicketUser || String(u.id) === String(newTicketUser))) || usersList[0] || {
      name: 'Investor',
      email: 'investor@example.com',
      phone: '',
      currentRank: 'Starter',
      customId: 'HORIZON-USR-01'
    };

    const newTicketObj = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      customId: selectedUserObj.customId || `HORIZON-USR-0${selectedUserObj.id || 1}`,
      userName: selectedUserObj.name || selectedUserObj.fullName || 'Investor',
      userEmail: selectedUserObj.email || '',
      userPhone: selectedUserObj.phone || '',
      userRank: selectedUserObj.currentRank || 'Level 1 (Starter)',
      userAvatar: (selectedUserObj.name || selectedUserObj.fullName || 'Investor').split(' ').map(n => n[0]).join(''),
      subject: newTicketSubject.trim(),
      category: newTicketCategory,
      priority: newTicketPriority,
      status: 'Open',
      createdAt: 'Just now',
      lastActivity: 'Just now',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'admin',
          senderName: 'Helpdesk Admin',
          time: 'Just now',
          text: newTicketMessage.trim(),
          attachments: []
        }
      ]
    };

    setTickets([newTicketObj, ...tickets]);
    setIsNewTicketOpen(false);
    setNewTicketSubject('');
    setNewTicketMessage('');
  };

  const getPriorityBadge = (p) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-red-50 text-red-700 text-[11px] font-bold border border-red-200 whitespace-nowrap">Urgent</span>;
      case 'high':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-[11px] font-semibold border border-orange-200 whitespace-nowrap">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200 whitespace-nowrap">Medium</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200 whitespace-nowrap">Low</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s.toLowerCase()) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-300 shadow-2xs whitespace-nowrap">Open</span>;
      case 'in progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-300 shadow-2xs whitespace-nowrap">In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-300 shadow-2xs whitespace-nowrap">Resolved</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 shadow-2xs whitespace-nowrap">Closed</span>;
    }
  };

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
        title="Support Tickets & Client Helpdesk"
        subtitle="CRM support desk, chronological conversation threads, direct file attachments & live responses"
        badge="24/7 Desk"
        actions={
          <Button
            variant="primary"
            icon={<RiAddLine />}
            onClick={() => setIsNewTicketOpen(true)}
          >
            Create Support Ticket
          </Button>
        }
      />

      {/* ──────────────── ROLLING ODOMETER SUMMARY STAT CARDS ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Support Inquiries"
          numericValue={totalCount}
          prefix=""
          decimals={0}
          change="+18.2%"
          positive={true}
          icon="chart"
        />
        <KPICard
          title="Pending / Open Tickets"
          numericValue={openCount + inProgressCount}
          prefix=""
          decimals={0}
          change="-4.5%"
          positive={true}
          icon="money"
        />
        <KPICard
          title="Avg. First Response Time"
          numericValue={14}
          prefix=""
          suffix=" Mins"
          decimals={0}
          change="Real-time"
          positive={true}
          icon="wallet"
        />
        <KPICard
          title="Client Resolution Rate"
          numericValue={98.4}
          prefix=""
          suffix="%"
          decimals={1}
          change="+1.2%"
          positive={true}
          icon="users"
        />
      </div>

      {/* ──────────────── FILTER BAR & SEARCH CONTROLS ──────────────── */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <SearchBar
            placeholder="Search tickets by ID (TCK-8921), subject, user name, email, or user ID..."
            value={search}
            onChange={setSearch}
            className="flex-1 w-full"
          />

          <div className="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto">
            {/* Priority Filter Dropdown */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-gold-400"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Category Filter Dropdown (NO KYC) */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 outline-none focus:border-gold-400"
            >
              <option value="all">All Categories</option>
              <option value="Deposit & Funding">Deposit & Funding</option>
              <option value="Bank & Wire">Bank & Wire</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="ROI & Yields">ROI & Yields</option>
              <option value="Vault & Custody">Vault & Custody</option>
              <option value="Rank & Rewards">Rank & Rewards</option>
              <option value="Security & Account">Security & Account</option>
              <option value="Referral Commission">Referral Commission</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tab Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'all', label: 'All Tickets', count: totalCount },
            { id: 'open', label: 'Open', count: openCount },
            { id: 'in progress', label: 'In Progress', count: inProgressCount },
            { id: 'resolved', label: 'Resolved', count: resolvedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                statusFilter === tab.id
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

      {/* ──────────────── TICKETS DATA TABLE (20 PER PAGE, PAGINATION CONTROLS) ──────────────── */}
      <div className="card overflow-hidden">
        <div className="table-container">
          <table className="data-table font-poppins">
            <thead>
              <tr className="text-slate-400 font-medium text-xs tracking-wider">
                <th className="font-medium text-slate-500 whitespace-nowrap">Ticket ID</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">User Details</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Email</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Mobile Number</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Category / Dept</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Subject & Inquiry</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Priority</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Messages</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Created Date</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Last Activity</th>
                <th className="font-medium text-slate-500 whitespace-nowrap">Status</th>
                <th className="text-right pr-6 font-medium text-slate-500 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((t, i) => (
                  <tr
                    key={t.id}
                    className="animate-fade-in hover:bg-slate-50/70 transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 35}ms` }}
                    onClick={() => setActiveTicket(t)}
                  >
                    {/* Ticket ID */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/80 text-gold-900 text-xs font-bold border border-gold-300/80 font-mono whitespace-nowrap shadow-2xs">
                        <RiTicketLine size={13} className="text-gold-600" />
                        {t.id}
                      </span>
                    </td>

                    {/* User Details (Large Round Avatar) */}
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center flex-shrink-0 shadow-xs ring-2 ring-gold-200/80 text-xs font-poppins">
                          {t.userAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate leading-tight font-poppins">
                            {t.userName}
                          </p>
                          <p className="text-[11px] font-medium text-gold-600 font-poppins tracking-tight mt-0.5">
                            {t.customId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="text-xs font-normal text-slate-500 font-poppins whitespace-nowrap">
                      {t.userEmail}
                    </td>

                    {/* Mobile Number */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      {t.userPhone}
                    </td>

                    {/* Category / Dept */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 text-slate-700 text-xs font-medium border border-slate-200/80 whitespace-nowrap font-poppins">
                        {t.category}
                      </span>
                    </td>

                    {/* Subject & Inquiry (Clean single-line truncate) */}
                    <td className="max-w-[280px]">
                      <p className="text-xs font-semibold text-slate-800 truncate font-poppins" title={t.subject}>
                        {t.subject}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5" title={t.messages[t.messages.length - 1]?.text}>
                        {t.messages[t.messages.length - 1]?.text}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="whitespace-nowrap">
                      {getPriorityBadge(t.priority)}
                    </td>

                    {/* Messages Count Badge */}
                    <td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 whitespace-nowrap font-poppins">
                        <RiChat1Line size={13} className="text-blue-500" />
                        {t.messages.length} Msgs
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="text-xs text-slate-500 font-normal font-poppins whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <RiTimeLine size={13} className="text-slate-400" />
                        {t.createdAt}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="text-xs font-medium text-slate-600 font-poppins whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-gold-700 font-medium">
                        <RiTimeLine size={13} className="text-gold-600" />
                        {t.lastActivity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>

                    {/* Action: View Thread + Delete Ticket */}
                    <td className="text-right pr-6 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveTicket(t)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-400 hover:bg-gold-500 text-slate-900 text-xs font-semibold transition-all border border-gold-400 hover:border-gold-500 active:scale-95 shadow-gold font-poppins whitespace-nowrap"
                          title="Open full conversation thread"
                        >
                          <RiChat1Line size={14} className="text-slate-900" />
                          <span>View Thread</span>
                        </button>

                        <button
                          onClick={() => setDeletingTicket(t)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all border border-slate-200 shadow-2xs"
                          title="Delete Support Ticket"
                        >
                          <RiDeleteBinLine size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400 font-poppins">
            No support tickets found matching your filter criteria.
          </div>
        )}

        {/* ──────────────── 20 ITEMS PER PAGE PAGINATION BAR ──────────────── */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredTickets.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ──────────────── KINETOSCOPE-STYLE TICKET THREAD SLIDE-OVER DRAWER ──────────────── */}
      <Modal
        isOpen={!!activeTicket}
        onClose={() => setActiveTicket(null)}
        title={activeTicket ? `Ticket ${activeTicket.id}: ${activeTicket.subject}` : 'Ticket Details'}
        subtitle={activeTicket ? `${activeTicket.category} • Created ${activeTicket.createdAt}` : ''}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="sm"
              icon={<RiDeleteBinLine />}
              onClick={() => setDeletingTicket(activeTicket)}
            >
              Delete Ticket
            </Button>
            <Button variant="secondary" onClick={() => setActiveTicket(null)}>
              Close Desk
            </Button>
          </div>
        }
      >
        {activeTicket && (
          <div className="space-y-4 font-poppins">
            {/* User Profile Header Card (Clean Spacious Layout, No Squishing) */}
            <div className="p-4 bg-gold-50/60 rounded-2xl border border-gold-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-500 text-slate-900 font-bold flex items-center justify-center text-sm ring-2 ring-gold-200 flex-shrink-0 shadow-xs">
                  {activeTicket.userAvatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{activeTicket.userName}</h4>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-lg border border-gold-300 text-[11px] font-semibold text-gold-900 shadow-2xs whitespace-nowrap">
                      <RiTrophyLine size={12} className="text-gold-600" />
                      {activeTicket.userRank}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-poppins mt-0.5 truncate">{activeTicket.customId} • {activeTicket.userEmail}</p>
                  <p className="text-[11px] text-slate-400 font-poppins">{activeTicket.userPhone}</p>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                <select
                  value={activeTicket.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-gold-400 cursor-pointer"
                >
                  <option value="Open">Status: Open</option>
                  <option value="In Progress">Status: In Progress</option>
                  <option value="Resolved">Status: Resolved</option>
                  <option value="Closed">Status: Closed</option>
                </select>
              </div>
            </div>

            {/* Ticket Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Priority</span>
                <span className="font-semibold text-slate-800 block mt-0.5">{activeTicket.priority}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
                <span className="font-semibold text-slate-800 block mt-0.5 truncate">{activeTicket.category}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Messages</span>
                <span className="font-bold text-gold-700 block mt-0.5">{activeTicket.messages.length}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Update</span>
                <span className="font-semibold text-slate-600 block mt-0.5">{activeTicket.lastActivity}</span>
              </div>
            </div>

            {/* ──────────────── MESSAGE CONVERSATION STREAM ──────────────── */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-3.5 max-h-[380px] overflow-y-auto">
              <div className="text-center">
                <span className="px-3 py-1 bg-white rounded-full text-[10px] font-medium text-slate-400 border border-slate-200 shadow-2xs">
                  Ticket initiated on {activeTicket.createdAt}
                </span>
              </div>

              {activeTicket.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isInternal = msg.sender === 'internal';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.time}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isInternal
                          ? 'bg-amber-100/90 text-amber-900 border border-amber-300 rounded-tr-none'
                          : isUser
                            ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            : 'bg-gold-50 text-slate-800 border border-gold-300 rounded-tr-none'
                      }`}
                    >
                      {isInternal && (
                        <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                          Private Admin Note (Hidden from User)
                        </span>
                      )}
                      <p>{msg.text}</p>

                      {/* ──────────────── RICH MULTIMEDIA ATTACHMENT CARD PREVIEWS ──────────────── */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/70 space-y-2.5">
                          {msg.attachments.map((att, attIdx) => {
                            const mType = getMediaType(att);

                            return (
                              <div key={attIdx}>
                                {/* 1. IMAGE ATTACHMENT (Direct Thumbnail + 1-Click Popup Lightbox) */}
                                {mType === 'image' && (
                                  <div className="p-2.5 bg-white/95 rounded-xl border border-gold-300 shadow-2xs space-y-2 font-poppins">
                                    <div
                                      onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: 'image', fileSize: '1.2 MB' })}
                                      className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-900 cursor-pointer aspect-[16/9] flex items-center justify-center"
                                    >
                                      {/* Simulated Blockchain / Wire Receipt Graphic */}
                                      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/60 flex flex-col justify-between p-3">
                                        <div className="flex items-center justify-between text-[10px] text-gold-400 font-mono">
                                          <span>TXID: 8fa928...31b4</span>
                                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">VERIFIED</span>
                                        </div>
                                        <div className="text-center">
                                          <p className="text-xs font-bold text-white tracking-wide">Blockchain Transaction Slip</p>
                                          <p className="text-[10px] text-slate-400">TRON TRC-20 Mainnet Settlement</p>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                          <span className="text-gold-400 font-bold">$50,000.00 USDT</span>
                                          <span>32 Confirmations</span>
                                        </div>
                                      </div>

                                      {/* Hover Dark Overlay with Zoom Icon */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-semibold text-xs backdrop-blur-xs">
                                        <RiZoomInLine size={18} className="text-gold-400" />
                                        <span>Click to Enlarge Popup</span>
                                      </div>
                                    </div>

                                    {/* File Metadata & Actions */}
                                    <div className="flex items-center justify-between gap-2 pt-0.5">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{att}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">1.2 MB • Image / Screenshot</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: 'image', fileSize: '1.2 MB' })}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-[11px] font-bold rounded-lg shadow-gold transition-all"
                                          title="Open in Popup Lightbox"
                                        >
                                          <RiEyeLine size={13} />
                                          <span>Preview</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => alert(`Dispatched download for: ${att}`)}
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                          title="Download Image"
                                        >
                                          <RiDownloadLine size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 2. PDF ATTACHMENT (Official PDF Card + Interactive Reader Popup) */}
                                {mType === 'pdf' && (
                                  <div className="p-2.5 bg-white/95 rounded-xl border border-gold-300 shadow-2xs flex items-center justify-between gap-3 font-poppins">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                        <RiFilePdfLine size={20} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{att}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">1.4 MB • 2 Pages PDF Document</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: 'pdf', fileSize: '1.4 MB' })}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-[11px] font-bold rounded-lg shadow-gold transition-all"
                                        title="Open PDF Reader Popup"
                                      >
                                        <RiEyeLine size={13} />
                                        <span>Preview PDF</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => alert(`Dispatched download for: ${att}`)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                        title="Download PDF"
                                      >
                                        <RiDownloadLine size={13} />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* 3. VIDEO ATTACHMENT (Video Card + Interactive Player Popup) */}
                                {mType === 'video' && (
                                  <div className="p-2.5 bg-white/95 rounded-xl border border-gold-300 shadow-2xs space-y-2 font-poppins">
                                    <div
                                      onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: 'video', fileSize: '8.4 MB' })}
                                      className="relative group rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer aspect-[16/9] flex items-center justify-center"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-amber-950/40 opacity-80" />
                                      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                                        <div className="w-10 h-10 rounded-full bg-gold-400 text-slate-950 flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                                          <RiPlayFill size={20} className="ml-0.5" />
                                        </div>
                                        <span className="text-[11px] font-bold text-white tracking-wide">Play Inspection Video</span>
                                      </div>
                                      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] font-mono text-gold-400">
                                        00:45 HD
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-0.5">
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{att}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">8.4 MB • MP4 Video File</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: 'video', fileSize: '8.4 MB' })}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-[11px] font-bold rounded-lg shadow-gold transition-all"
                                        >
                                          <RiPlayFill size={13} />
                                          <span>Play Video</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => alert(`Dispatched download for: ${att}`)}
                                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                        >
                                          <RiDownloadLine size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 4. SPREADSHEET / DOCUMENT ATTACHMENT */}
                                {(mType === 'spreadsheet' || mType === 'document') && (
                                  <div className="p-2.5 bg-white/95 rounded-xl border border-gold-300 shadow-2xs flex items-center justify-between gap-3 font-poppins">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                                        mType === 'spreadsheet' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                      }`}>
                                        {mType === 'spreadsheet' ? <RiFileExcelLine size={20} /> : <RiFileWordLine size={20} />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate">{att}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{mType === 'spreadsheet' ? 'Excel Ledger' : 'Word Doc'} • 1.8 MB</p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedMedia({ fileName: att, senderName: msg.senderName, time: msg.time, fileType: mType, fileSize: '1.8 MB' })}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gold-400 hover:bg-gold-500 text-slate-900 text-[11px] font-bold rounded-lg shadow-gold transition-all"
                                      >
                                        <RiEyeLine size={13} />
                                        <span>Inspect</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => alert(`Dispatched download for: ${att}`)}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs"
                                      >
                                        <RiDownloadLine size={13} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ──────────────── ADMIN CUSTOM REPLY COMPOSER (CLEAN, NO QUICK MACROS) ──────────────── */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Compose Official Response</span>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Default ON Email Notification Toggle */}
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={sendEmailNotification}
                      onChange={e => setSendEmailNotification(e.target.checked)}
                      className="rounded text-gold-500 focus:ring-gold-400"
                    />
                    <span className="flex items-center gap-1">
                      <RiMailLine size={13} className="text-gold-600" />
                      Email Notification (Default ON)
                    </span>
                  </label>

                  {/* Internal Note Toggle */}
                  <label className="inline-flex items-center gap-1.5 text-xs text-amber-800 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                      className="rounded text-gold-500 focus:ring-gold-400"
                    />
                    <span>Post as Internal Admin Note</span>
                  </label>
                </div>
              </div>

              <textarea
                rows={4}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder={isInternalNote ? 'Type an internal private note for support staff...' : 'Type your comprehensive response to the investor...'}
                className={`w-full p-3.5 text-xs rounded-xl border outline-none font-poppins transition-colors ${
                  isInternalNote
                    ? 'bg-amber-50/50 border-amber-300 text-amber-900 focus:border-amber-400'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-gold-400'
                }`}
              />

              {/* Hidden File Input supporting Images, PDFs, Videos, Documents */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setAttachedFile(file.name);
                    try {
                      const uploadRes = await uploadFileToCloudinary(file, {
                        folder: "horizoncap/tickets",
                      });
                      if (uploadRes?.secure_url) {
                        setAttachedFileUrl(uploadRes.secure_url);
                      }
                    } catch (err) {
                      console.warn("Attachment upload fallback:", err.message);
                    }
                  }
                }}
              />

              {/* Bottom Actions: File Attachment + Live Upload Preview + Send Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-gold-50 text-slate-700 hover:text-gold-900 rounded-xl border border-slate-200 text-xs font-medium cursor-pointer transition-colors shadow-2xs"
                  >
                    <RiAttachment2 size={15} className="text-gold-600" />
                    <span>Attach Media / Doc / Video</span>
                  </button>

                  {attachedFile && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-50 text-gold-900 border border-gold-300 rounded-xl text-xs font-medium shadow-2xs">
                      {getMediaType(attachedFile) === 'image' && <RiImageLine size={15} className="text-gold-600" />}
                      {getMediaType(attachedFile) === 'pdf' && <RiFilePdfLine size={15} className="text-red-500" />}
                      {getMediaType(attachedFile) === 'video' && <RiVideoLine size={15} className="text-blue-500" />}
                      {getMediaType(attachedFile) === 'document' && <RiFileWordLine size={15} className="text-indigo-500" />}
                      {getMediaType(attachedFile) === 'spreadsheet' && <RiFileExcelLine size={15} className="text-emerald-500" />}
                      <span className="font-semibold">{attachedFile}</span>

                      <button
                        type="button"
                        onClick={() => setSelectedMedia({ fileName: attachedFile, senderName: 'Super Admin Preview', time: 'Just Now', fileType: getMediaType(attachedFile) })}
                        className="text-[11px] text-gold-700 underline hover:text-gold-900 ml-1"
                      >
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-slate-400 hover:text-red-600 transition-colors ml-1"
                        title="Remove attachment"
                      >
                        <RiCloseLine size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  icon={<RiSendPlaneFill />}
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                >
                  {isInternalNote ? 'Save Private Note' : 'Send Official Reply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ──────────────── CENTERED MEDIA LIGHTBOX VIEWER MODAL (IMAGE, PDF, VIDEO, DOC POPUP) ──────────────── */}
      <MediaViewerModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        file={selectedMedia}
      />

      {/* ──────────────── DELETE TICKET CONFIRMATION MODAL ──────────────── */}
      <Modal
        isOpen={!!deletingTicket}
        onClose={() => setDeletingTicket(null)}
        title="Delete Support Ticket"
        subtitle="This action will permanently purge the ticket and message thread history."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingTicket(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={<RiDeleteBinLine />} onClick={handleConfirmDelete}>
              Confirm Delete
            </Button>
          </>
        }
      >
        {deletingTicket && (
          <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200 space-y-2 text-xs font-poppins">
            <p className="font-semibold text-red-900">Are you sure you want to delete this ticket?</p>
            <p className="text-red-700 font-mono font-bold">{deletingTicket.id}: {deletingTicket.subject}</p>
            <p className="text-slate-500">Investor: {deletingTicket.userName} ({deletingTicket.customId})</p>
          </div>
        )}
      </Modal>

      {/* ──────────────── CREATE NEW SUPPORT TICKET MODAL ──────────────── */}
      <Modal
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        title="Create New Support Ticket"
        subtitle="Log an official inquiry or escalate an investor case"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewTicketOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<RiCheckLine />} onClick={handleCreateTicket}>
              Open Ticket
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTicket} className="space-y-4 font-poppins">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Investor / Account *
            </label>
            <select
              value={newTicketUser}
              onChange={e => setNewTicketUser(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400"
            >
              {usersList.map(u => (
                <option key={u._id || u.id || u.customId} value={u._id || u.customId || u.id}>
                  {u.name || u.fullName} ({u.customId || u._id}) • {u.email}
                </option>
              ))}
              {usersList.length === 0 && (
                <option value="">No registered users found</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ticket Subject *
            </label>
            <input
              type="text"
              placeholder="e.g. Deposit confirmation verification for Wire #89201"
              value={newTicketSubject}
              onChange={e => setNewTicketSubject(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-gold-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={newTicketCategory}
                onChange={e => setNewTicketCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400"
              >
                <option value="Deposit & Funding">Deposit & Funding</option>
                <option value="Bank & Wire">Bank & Wire</option>
                <option value="Withdrawal">Withdrawal</option>
                <option value="ROI & Yields">ROI & Yields</option>
                <option value="Vault & Custody">Vault & Custody</option>
                <option value="Rank & Rewards">Rank & Rewards</option>
                <option value="Security & Account">Security & Account</option>
                <option value="Referral Commission">Referral Commission</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority *
              </label>
              <select
                value={newTicketPriority}
                onChange={e => setNewTicketPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Message / Inquiry Details *
            </label>
            <textarea
              rows={4}
              value={newTicketMessage}
              onChange={e => setNewTicketMessage(e.target.value)}
              placeholder="Enter comprehensive description of the issue or inquiry..."
              className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-gold-400 font-poppins"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
