import multer from 'multer';


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
    files: 5
  },
  fileFilter: fileFilter
});

export const uploadSingle = upload.single('file'); 
export const uploadLogo = upload.single('logo'); 
export const uploadPostImages = upload.array('images', 5);
export const uploadAny = upload.any();

export default upload;