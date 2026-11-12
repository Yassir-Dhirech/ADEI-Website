const multer = require('multer');
const path = require('path');
const fs = require('fs');

const SERVER_ROOT = path.resolve(__dirname, '..');
const UPLOAD_DIR = path.join(SERVER_ROOT, 'uploads');

const safeDeleteUpload = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || fileUrl === '/images/default.jpg') {
    return;
  }
  const relativePath = fileUrl.replace(/^\/+/, '');
  const resolvedPath = path.resolve(SERVER_ROOT, relativePath);
  if (resolvedPath.startsWith(UPLOAD_DIR + path.sep) && fs.existsSync(resolvedPath)) {
    fs.unlinkSync(resolvedPath);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedDocTypes = /pdf|doc|docx|txt/;
    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    const isImage = allowedImageTypes.test(extname) && /image/.test(mimetype);
    const isDocument = allowedDocTypes.test(extname) &&
      (mimetype.includes('pdf') ||
        mimetype.includes('document') ||
        mimetype.includes('text') ||
        mimetype.includes('msword') ||
        mimetype.includes('wordprocessingml'));

    if (isImage || isDocument) {
      return cb(null, true);
    }
    cb(new Error('Seules les images (jpeg, jpg, png, gif, webp) et les documents (pdf, doc, docx, txt) sont autorisés'));
  }
});

module.exports = { UPLOAD_DIR, safeDeleteUpload, upload };