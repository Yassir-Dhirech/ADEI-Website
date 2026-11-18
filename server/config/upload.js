const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileType = require('file-type');

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
const ALLOWED_REAL_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip' // Certains fichiers .docx sont détectés comme conteneurs ZIP (PK..)
]);

/**
 * Middleware post-Multer : vérifie les magic bytes réels des fichiers uploadés.
 * Supprime immédiatement tout fichier falsifié du disque et renvoie 400.
 */
const validateUploadedFiles = async (req, res, next) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).forEach((fileArray) => files.push(...fileArray));
    }
  }

  if (files.length === 0) return next();

  const cleanupAll = () => {
    for (const f of files) {
      if (f.path && fs.existsSync(f.path)) {
        fs.unlinkSync(f.path);
      }
    }
  };

  try {
    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();

      // Les fichiers texte brut (.txt) n'ont pas de magic bytes : on rejette les octets nuls (binaires)
      if (ext === '.txt') {
        const buffer = fs.readFileSync(file.path);
        if (buffer.includes(0x00)) {
          cleanupAll();
          return res.status(400).json({
            success: false,
            message: 'Fichier texte invalide (contenu binaire détecté)',
            code: 'UPLOAD_ERROR'
          });
        }
        continue;
      }

      const detected = await FileType.fromFile(file.path);
      const isDocxAsZip = detected && detected.mime === 'application/zip' && ext === '.docx';

      if (!detected || (!ALLOWED_REAL_MIMES.has(detected.mime) && !isDocxAsZip)) {
        cleanupAll();
        return res.status(400).json({
          success: false,
          message: 'Type de fichier réel invalide ou falsifié (signature binaire rejetée)',
          code: 'UPLOAD_ERROR'
        });
      }
    }

    return next();
  } catch (error) {
    cleanupAll();
    return next(error);
  }
};

module.exports = { UPLOAD_DIR, safeDeleteUpload, upload, validateUploadedFiles };