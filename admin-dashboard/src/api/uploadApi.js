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
