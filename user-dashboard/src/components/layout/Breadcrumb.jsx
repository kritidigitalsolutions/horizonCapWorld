import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiHome4Line } from 'react-icons/ri';
import { UilAngleRight } from '@iconscout/react-unicons';

const routeLabels = {
  'plans': 'Investment Plans',
  'investments': 'My Investments',
  'transactions': 'Transactions',
  'deposit': 'Deposit Funds',
  'withdraw': 'Withdraw Funds',
  'referrals': 'Referral Network',
  'referral-plans': 'Referral Commission Plans',
  'ranks': 'Rank Progression Ladder',
  'notifications': 'Notification Center',
  'profile': 'My Profile',
  'support': 'Support Desk',
  'news': 'News & Media',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-1 font-poppins">
      <Link to="/" className="flex items-center gap-1 text-gray-400 hover:text-gold-500 transition-colors">
        <RiHome4Line size={16} />
        <span>Home</span>
      </Link>
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment}>
          <UilAngleRight size={16} className="text-gray-300" />
          <span className={index === pathSegments.length - 1 ? 'text-gray-700 font-medium' : 'text-gray-400'}>
            {routeLabels[segment] || segment}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
