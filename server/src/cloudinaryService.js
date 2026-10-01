import cloudinary from './cloudinaryConfig.js';

const bufferToDataUrl = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString('base64')}`;
};

export const uploadFile = async (file, folder) => {
  const dataUrl = bufferToDataUrl(file.buffer, file.mimetype);
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: folder,
    quality: 'auto',
    fetch_format: 'auto'
  });
  return {
    public_id: result.public_id,  // store this in DB
    url: result.secure_url        // optional, for immediate response
  };
};

export const deleteFile = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};

export const getImageUrl = (public_id, transformations = {}) => {
  if (!public_id) return null;
  return cloudinary.url(public_id, {
    secure: true,
    ...transformations
  });
};