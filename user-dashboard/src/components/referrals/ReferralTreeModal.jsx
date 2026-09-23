import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import ReferralTreeView from './ReferralTreeView';
import { getReferralNetwork } from '../../api/referralsApi';
import { useAuth, getReferralLink } from '../../context/AuthContext';
import { RiNodeTree, RiSparklingLine, RiRefreshLine } from 'react-icons/ri';

export default function ReferralTreeModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPartner, setSelectedPartner] = useState(null);

  const referralLink = user?.referralLink || (user?.customId ? getReferralLink(user.customId) : '');

  const loadTree = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getReferralNetwork();
      if (res?.success && res.tree) {
        setTree(res.tree);
      } else if (res?.tree) {
        setTree(res.tree);
      } else {
        // Fallback root tree node if empty
        setTree({
          id: user?.customId || 'YOU',
          name: user?.name || user?.fullName || 'Investor',
          email: user?.email || '',
          phone: user?.phone || '—',
          avatar: user?.avatar || '',
          rank: user?.rank?.name || user?.currentRank || 'Associate',
          level: 0,
          tierName: 'Level 0 (Self)',
          commissionRate: 0,
          commissionEarned: 0,
          invested: Number(user?.totalInvested || 0),
          depositWallet: Number(user?.depositWallet || 0),
          status: user?.status || 'Active',
          totalEarnedCommission: 0,
          children: [],
        });
      }
    } catch (err) {
      console.warn('[Referral Tree Modal] Failed to load referral tree:', err.message);
      setError('Unable to load downline tree right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Referral Network Tree (Tier 0 – 10)"
      subtitle="Interactive genealogy tree showing all downline partners, investment volumes & earned commissions"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={loadTree}
            disabled={loading}
            className="btn btn-secondary text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RiRefreshLine size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Tree</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary text-xs px-5 py-2 rounded-xl font-bold shadow-gold cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="py-2">
        {loading ? (
          <div className="space-y-4 py-8 text-center font-poppins">
            <div className="w-12 h-12 rounded-2xl bg-gold-100 text-gold-700 flex items-center justify-center mx-auto animate-pulse">
              <RiNodeTree size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">Constructing Your Multi-Tier Referral Tree...</p>
            <p className="text-xs text-slate-400">Traversing Downlines across Tiers 1 through 10</p>
            <div className="skeleton h-48 w-full rounded-2xl mt-4" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-center space-y-3 font-poppins">
            <p className="text-xs font-bold">{error}</p>
            <button
              type="button"
              onClick={loadTree}
              className="btn btn-secondary text-xs px-4 py-2 rounded-xl font-bold"
            >
              Try Again
            </button>
          </div>
        ) : (
          <ReferralTreeView
            tree={tree}
            referralLink={referralLink}
            onSelectPartner={(partner) => setSelectedPartner(partner)}
          />
        )}
      </div>
    </Modal>
  );
}
