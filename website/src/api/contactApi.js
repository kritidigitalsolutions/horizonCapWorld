// Dynamic Base API URL resolution
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return 'https://api.horizoncapworld.com/api';
};

/**
 * Submit contact inquiry to backend
 * @param {Object} data { name, email, sector, message }
 * @returns {Promise<Object>} API response
 */
export const submitContactInquiry = async ({ name, email, sector, message }) => {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/contact`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      name: name?.trim(),
      email: email?.trim(),
      sector: sector?.trim() || 'Renewable Energy',
      message: message?.trim() || '',
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || `Inquiry submission failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
};
