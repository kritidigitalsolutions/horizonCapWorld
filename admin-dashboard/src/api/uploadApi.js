import API from './api';

/**
 * Uploads a file (File object, Blob, or base64 string) to Cloudinary via backend API
 * Supports automatic old file deletion when 'oldUrl' is passed!
 * @param {File|Blob|string} file - File object or base64 data URL
 * @param {object} options - { folder, oldUrl, resource_type, onUploadProgress }
 * @returns {Promise<{ success: boolean, url: string, secure_url: string, public_id: string }>}
 */
export const uploadFileToCloudinary = async (file, options = {}) => {
  const { folder = 'horizoncap/general', oldUrl, resource_type = 'auto', onUploadProgress } = options;

  // If already a hosted Cloudinary URL and not updating, return as is
  if (typeof file === 'string' && file.startsWith('https://res.cloudinary.com') && !oldUrl) {
    return { success: true, url: file, secure_url: file };
  }

  // If it's a File or Blob, use FormData
  if (file instanceof File || file instanceof Blob) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (oldUrl) formData.append('oldUrl', oldUrl);
    if (resource_type) formData.append('resource_type', resource_type);

    const res = await API.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return res.data;
  }

  // If it's a base64 string
  const res = await API.post('/upload', {
    file,
    folder,
    oldUrl,
    resource_type,
  });
  return res.data;
};

/**
 * Deletes a file from Cloudinary storage
 * @param {string} urlOrPublicId - Cloudinary URL or publicId
 */
export const deleteFileFromCloudinary = async (urlOrPublicId) => {
  if (!urlOrPublicId) return { success: true };
  try {
    const res = await API.post('/upload/delete', { url: urlOrPublicId });
    return res.data;
  } catch (error) {
    console.warn('[Cloudinary Delete Error]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Uploads large videos directly from browser to Cloudinary CDN (up to 2 GB)
 * using secure backend signed parameters. Bypasses backend server memory limits.
 * @param {File} file - Video file object
 * @param {object} options - { folder, onUploadProgress }
 * @returns {Promise<{ success: boolean, url: string, secure_url: string, public_id: string, bytes: number, duration: number }>}
 */
export const uploadVideoDirectToCloudinary = async (file, options = {}) => {
  const { folder = 'horizoncap/videos', onUploadProgress } = options;

  if (!file) {
    throw new Error('Please select a video file to upload.');
  }

  // 2 GB limit validation (2 * 1024 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Video file size (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB) exceeds the maximum allowed limit of 2 GB.`);
  }

  // 1. Fetch Cloudinary signature from backend
  const sigRes = await API.get(`/upload/signature?folder=${encodeURIComponent(folder)}`);
  if (!sigRes.data?.success) {
    throw new Error(sigRes.data?.message || 'Failed to authenticate upload with Cloudinary.');
  }

  const { signature, timestamp, apiKey, cloudName, folder: targetFolder } = sigRes.data;

  // 2. Prepare FormData for direct Cloudinary upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', targetFolder);

  // 3. Post directly to Cloudinary Video Upload API
  const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

  // Use axios directly so baseURL is not prepended
  const axiosModule = await import('axios');
  const axiosClient = axiosModule.default || axiosModule;

  const res = await axiosClient.post(cloudinaryUploadUrl, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
        onUploadProgress(percent, progressEvent.loaded, progressEvent.total);
      }
    },
  });

  return {
    success: true,
    url: res.data.secure_url || res.data.url,
    secure_url: res.data.secure_url || res.data.url,
    public_id: res.data.public_id,
    bytes: res.data.bytes,
    duration: res.data.duration,
    format: res.data.format,
    original_filename: res.data.original_filename,
  };
};

