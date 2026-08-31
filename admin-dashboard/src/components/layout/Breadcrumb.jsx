import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiHome4Line } from 'react-icons/ri';
import { UilAngleRight } from '@iconscout/react-unicons';

const routeLabels = {
  'investment-plans': 'Investment Plans',
  'users': 'Users Management',
  'ranks': 'Rank Ladder',
  'referrals': 'Referral Plans',
  'transactions': 'Transactions',
  'support-tickets': 'Support Tickets',
  'support-channels': 'Support Channels',
  'news-media': 'News & Media',
  'payment-settings': 'Payment Settings',
  'settings': 'Settings',
};

export default function Breadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname
    .split('/')
    .filter(Boolean)
    .filter(segment => segment !== 'admin');

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      <Link to="/admin" className="flex items-center gap-1 text-gray-400 hover:text-gold-500 transition-colors">
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
