import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiHome4Line } from 'react-icons/ri';
import { UilAngleRight } from '@iconscout/react-unicons';

const routeLabels = {
  'plans': 'Investment Plans',
  'investments': 'My Investments',
  'transactions': 'Transactions',
  'deposit': 'Deposit Funds',
  'withdraw': 'Withdraw Funds',
  'referrals': 'Level Network',
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
  const [dynamicTitle, setDynamicTitle] = useState(() => {
    // Initial check from router location state
    return location.state?.title || '';
  });

  useEffect(() => {
    // If state has title on navigation, use it
    if (location.state?.title) {
      setDynamicTitle(location.state.title);
    } else {
      // Check cached title in sessionStorage for news articles
      const articleId = pathSegments[1];
      if (pathSegments[0] === 'news' && articleId) {
        const cached = sessionStorage.getItem(`news_title_${articleId}`);
        if (cached) setDynamicTitle(cached);
      } else {
        setDynamicTitle('');
      }
    }

    const handleTitleUpdate = (e) => {
      if (e.detail) {
        setDynamicTitle(e.detail);
      }
    };

    window.addEventListener('update-breadcrumb-title', handleTitleUpdate);
    return () => {
      window.removeEventListener('update-breadcrumb-title', handleTitleUpdate);
    };
  }, [location.pathname, location.state]);

  if (pathSegments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs sm:text-sm mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-1 font-poppins">
      <Link to="/" className="flex items-center gap-1 text-gray-400 hover:text-gold-500 transition-colors">
        <RiHome4Line size={16} />
        <span>Home</span>
      </Link>
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const isHexId = /^[0-9a-fA-F]{24}$/.test(segment) || (/^[a-z0-9_-]{16,}$/i.test(segment) && !routeLabels[segment]);

        let displayLabel = routeLabels[segment] || segment;
        if (isHexId) {
          displayLabel = dynamicTitle || 'Article Details';
        }

        // Determine link path for intermediate items
        const linkPath = '/' + pathSegments.slice(0, index + 1).join('/');

        return (
          <React.Fragment key={segment}>
            <UilAngleRight size={16} className="text-gray-300 flex-shrink-0" />
            {isLast ? (
              <span
                className="text-gray-700 font-medium max-w-[200px] sm:max-w-md md:max-w-lg truncate inline-block align-bottom"
                title={typeof displayLabel === 'string' ? displayLabel : ''}
              >
                {displayLabel}
              </span>
            ) : (
              <Link
                to={linkPath}
                className="text-gray-400 hover:text-gold-500 transition-colors"
              >
                {displayLabel}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
